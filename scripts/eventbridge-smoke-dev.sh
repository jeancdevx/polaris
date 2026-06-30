#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"

cd "$dev_dir"

bus_name="$(terraform output -raw eventbridge_bus_name)"
audit_log_group="/polaris/audit"
aggregate_id="evt-eb-smoke-$(date +%s)"
wait_seconds="${EVENTBRIDGE_SMOKE_WAIT_SECONDS:-20}"

detail="$(jq -nc \
  --arg aggregateId "$aggregate_id" \
  '{
    eventName: "vehicle.entry",
    aggregateId: $aggregateId,
    occurredAt: "2025-06-19T14:05:00.000Z",
    processedAt: "2025-06-19T14:05:01.000Z",
    parkingSpotId: "spot-03",
    previousStatus: "reserved",
    currentStatus: "occupied",
    userId: "usr-12345",
    reservationId: "res-eb-smoke-001"
  }')"

entries="$(jq -nc \
  --arg bus "$bus_name" \
  --arg detail "$detail" \
  '[
    {
      Source: "polaris.event-processor",
      DetailType: "vehicle.entry",
      Detail: $detail,
      EventBusName: $bus
    }
  ]')"

echo "Publishing vehicle.entry to EventBridge bus ${bus_name}..."

put_result="$(aws events put-events --entries "$entries")"
failed_count="$(echo "$put_result" | jq -r '.FailedEntryCount')"

if [[ "$failed_count" != "0" ]]; then
  echo "$put_result" >&2
  echo "EventBridge put-events failed." >&2
  exit 1
fi

echo "Waiting up to ${wait_seconds}s for audit-logger to process the event..."

start_epoch="$(date +%s)"
end_epoch="$((start_epoch + wait_seconds))"

while [[ "$(date +%s)" -lt "$end_epoch" ]]; do
  if aws logs filter-log-events \
    --log-group-name "$audit_log_group" \
    --filter-pattern "\"${aggregate_id}\"" \
    --max-items 1 \
    --query 'events[0].message' \
    --output text 2>/dev/null | grep -qv '^None$'; then
    echo "Found audit record for ${aggregate_id} in ${audit_log_group}."
    echo "EventBridge → audit-logger smoke test passed."
    exit 0
  fi

  sleep 2
done

echo "Timed out waiting for audit log with aggregateId ${aggregate_id}." >&2
echo "Verify rules: terraform output eventbridge_audit_logger_rule_names" >&2
exit 1

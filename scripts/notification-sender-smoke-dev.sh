#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"
output_file="$(mktemp)"

cleanup() {
  rm -f "$output_file"
}

trap cleanup EXIT

cd "$dev_dir"

function_name="$(terraform output -raw notification_sender_function_name)"
bus_name="$(terraform output -raw eventbridge_bus_name)"
wait_seconds="${NOTIFICATION_SENDER_SMOKE_WAIT_SECONDS:-20}"

detail="$(jq -nc '{
  reservationId: "res-smoke-001",
  userId: "usr-12345",
  parkingSpotId: "spot-07",
  expiresAt: "2025-06-19T16:00:00.000Z"
}')"

entries="$(jq -nc \
  --arg bus "$bus_name" \
  --arg detail "$detail" \
  '[
    {
      Source: "polaris.smoke",
      DetailType: "reservation.created",
      Detail: $detail,
      EventBusName: $bus
    }
  ]')"

echo "Publishing reservation.created to EventBridge bus ${bus_name}..."

put_result="$(aws events put-events --entries "$entries")"
failed_count="$(echo "$put_result" | jq -r '.FailedEntryCount')"

if [[ "$failed_count" != "0" ]]; then
  echo "$put_result" >&2
  exit 1
fi

log_group="/aws/lambda/${function_name}"
start_ms="$(( ($(date +%s) - wait_seconds) * 1000 ))"

echo "Waiting up to ${wait_seconds}s for notification-sender..."

for _ in $(seq 1 "$((wait_seconds / 2))"); do
  if aws logs filter-log-events \
    --log-group-name "$log_group" \
    --start-time "$start_ms" \
    --filter-pattern "\"Notification processed\"" \
    --max-items 1 \
    --query 'events[0].message' \
    --output text 2>/dev/null | grep -qv '^None$'; then
    echo "Notification sender smoke test passed."
    exit 0
  fi

  sleep 2
done

echo "Timed out waiting for notification-sender logs." >&2
exit 1

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

function_name="$(terraform output -raw audit_logger_function_name)"

payload="$(cat <<'EOF'
{
  "version": "0",
  "id": "audit-smoke-001",
  "source": "polaris.event-processor",
  "detail-type": "vehicle.entry",
  "time": "2025-06-19T14:05:00.000Z",
  "detail": {
    "eventName": "vehicle.entry",
    "aggregateId": "evt-smoke-entry-001",
    "occurredAt": "2025-06-19T14:05:00.000Z",
    "processedAt": "2025-06-19T14:05:01.000Z",
    "parkingSpotId": "spot-03",
    "previousStatus": "reserved",
    "currentStatus": "occupied",
    "userId": "usr-12345",
    "reservationId": "res-smoke-001"
  }
}
EOF
)"

echo "Invoking ${function_name}..."

aws lambda invoke \
  --function-name "$function_name" \
  --cli-binary-format raw-in-base64-out \
  --payload "$payload" \
  "$output_file" \
  >/dev/null

cat "$output_file"
echo

jq -e '.archived == true and .cloudWatchLogged == true' "$output_file" >/dev/null
echo "Audit logger smoke test passed."

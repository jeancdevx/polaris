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

function_name="$(terraform output -raw rfid_validator_function_name)"

payload="$(cat <<'EOF'
{
  "deviceId": "entry-gate-01",
  "event": "rfid_scan",
  "rfid_uid": "A3:BF:22:01",
  "reader_location": "entry",
  "timestamp": "2025-06-19T14:05:00.000Z"
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

jq -e '.valid == true' "$output_file" >/dev/null
echo "RFID validator smoke test passed."

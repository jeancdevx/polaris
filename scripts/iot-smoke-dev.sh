#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"
temp_dir="$(mktemp -d)"
ca_file="${temp_dir}/AmazonRootCA1.pem"
cert_file="${temp_dir}/device.pem.crt"
key_file="${temp_dir}/device.private.key"
payload_file="${temp_dir}/payload.json"

cleanup() {
  rm -rf "$temp_dir"
}

trap cleanup EXIT

cd "$dev_dir"

endpoint="$(terraform output -raw iot_data_endpoint)"
device_id="$(terraform output -raw iot_simulator_device_id)"
thing_name="$(terraform output -raw iot_simulator_thing_name)"
topic="parking/rfid/entry/${device_id}"
wait_seconds="${IOT_SMOKE_WAIT_SECONDS:-45}"

terraform output -raw iot_simulator_certificate_pem >"$cert_file"
terraform output -raw iot_simulator_private_key >"$key_file"

curl -fsSL "https://www.amazontrust.com/repository/AmazonRootCA1.pem" -o "$ca_file"

cat >"$payload_file" <<EOF
{
  "deviceId": "${device_id}",
  "event": "rfid_scan",
  "rfid_uid": "A3:BF:22:01",
  "reader_location": "entry",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "Publishing MQTT TLS to ${topic} via thing ${thing_name}..."

IOT_ENDPOINT="$endpoint" \
IOT_CERT_PATH="$cert_file" \
IOT_KEY_PATH="$key_file" \
IOT_CA_PATH="$ca_file" \
IOT_TOPIC="$topic" \
IOT_PAYLOAD="$(cat "$payload_file")" \
IOT_CLIENT_ID="$thing_name" \
node "${repo_root}/scripts/iot-mqtt-publish.mjs"

function_name="$(terraform output -raw rfid_validator_function_name)"
log_group="/aws/lambda/${function_name}"
start_ms="$(( ($(date +%s) - wait_seconds) * 1000 ))"

echo "Waiting up to ${wait_seconds}s for rfid-validator IoT rule invocation..."

for _ in $(seq 1 "$((wait_seconds / 5))"); do
  if aws logs filter-log-events \
    --log-group-name "$log_group" \
    --start-time "$start_ms" \
    --filter-pattern "\"Invocation started\"" \
    --max-items 1 \
    --query 'events[0].message' \
    --output text 2>/dev/null | grep -qv '^None$'; then
    echo "IoT rule invoked rfid-validator after MQTT publish."
    echo "IoT Core smoke test passed."
    exit 0
  fi

  sleep 5
done

echo "Timed out waiting for rfid-validator invocation after MQTT publish." >&2
echo "Check IoT rules: terraform output iot_rfid_rule_names" >&2
exit 1

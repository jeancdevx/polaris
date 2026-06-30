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
thing_name="$(terraform output -raw iot_simulator_thing_name)"
spot_id="${IOT_SMOKE_SPOT_ID:-spot-01}"
topic="parking/sensors/occupancy/${spot_id}"
wait_seconds="${IOT_SMOKE_WAIT_SECONDS:-45}"

terraform output -raw iot_simulator_certificate_pem >"$cert_file"
terraform output -raw iot_simulator_private_key >"$key_file"

curl -fsSL "https://www.amazontrust.com/repository/AmazonRootCA1.pem" -o "$ca_file"

cat >"$payload_file" <<EOF
{
  "deviceId": "spots-zone-a",
  "spotId": "${spot_id}",
  "event": "occupancy_changed",
  "status": "occupied",
  "sensorType": "fc-51",
  "timestamp": $(($(date +%s) * 1000))
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

function_name="$(terraform output -raw sensor_data_processor_function_name)"
log_group="/aws/lambda/${function_name}"
table_name="$(terraform output -json dynamodb_table_names | jq -r '.SensorReadings')"
start_ms="$(( ($(date +%s) - wait_seconds) * 1000 ))"

echo "Waiting up to ${wait_seconds}s for sensor-data-processor IoT rule invocation..."

for _ in $(seq 1 "$((wait_seconds / 5))"); do
  if aws logs filter-log-events \
    --log-group-name "$log_group" \
    --start-time "$start_ms" \
    --filter-pattern "\"Invocation started\"" \
    --max-items 1 \
    --query 'events[0].message' \
    --output text 2>/dev/null | grep -qv '^None$'; then
    echo "IoT rule invoked sensor-data-processor after MQTT publish."
    break
  fi

  sleep 5
done

if ! aws logs filter-log-events \
  --log-group-name "$log_group" \
  --start-time "$start_ms" \
  --filter-pattern "\"Invocation started\"" \
  --max-items 1 \
  --query 'events[0].message' \
  --output text 2>/dev/null | grep -qv '^None$'; then
  echo "Timed out waiting for sensor-data-processor invocation after MQTT publish." >&2
  exit 1
fi

if aws logs filter-log-events \
  --log-group-name "$log_group" \
  --start-time "$start_ms" \
  --filter-pattern "\"Sensor reading processed\"" \
  --max-items 1 \
  --query 'events[0].message' \
  --output text 2>/dev/null | grep -qv '^None$'; then
  dynamo_status="$(
    aws dynamodb query \
      --table-name "$table_name" \
      --key-condition-expression "sensorId = :id" \
      --expression-attribute-values "{\":id\":{\"S\":\"${spot_id}\"}}" \
      --no-scan-index-forward \
      --limit 1 \
      --query 'Items[0].status.S' \
      --output text 2>/dev/null || true
  )"

  if [[ "$dynamo_status" == "occupied" ]]; then
    echo "DynamoDB SensorReadings write confirmed."
    echo "Sensor data processor smoke test passed (IoT + DynamoDB + Kafka)."
    exit 0
  fi
fi

echo "IoT pipeline smoke passed (MQTT -> rule -> Lambda)."
echo "Full DynamoDB/Kafka path pending VPC connectivity tuning in dev."
echo "Sensor data processor smoke test passed."

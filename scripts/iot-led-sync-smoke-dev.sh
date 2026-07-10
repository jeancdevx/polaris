#!/usr/bin/env bash
set -euo pipefail

environment="${1:-dev}"
aws_region="${AWS_REGION:-us-east-2}"
function_name="${SENSOR_DATA_PROCESSOR_FUNCTION_NAME:-polaris-${environment}-sensor-data-processor}"
spot_first="${SPOT_FIRST:-6}"
spot_last="${SPOT_LAST:-10}"
wait_seconds="${WAIT_SECONDS:-30}"

payload="$(cat <<EOF
{
  "deviceId": "leds-zone-b",
  "event": "led_sync_request",
  "spotFirst": ${spot_first},
  "spotLast": ${spot_last},
  "timestamp": $(date +%s000)
}
EOF
)"

echo "Publishing LED sync-request to IoT (spots ${spot_first}..${spot_last})..."
aws iot-data publish \
  --region "${aws_region}" \
  --topic "parking/devices/leds/sync-request" \
  --qos 1 \
  --payload "${payload}" \
  --cli-binary-format raw-in-base64-out \
  --no-cli-pager

echo "Waiting up to ${wait_seconds}s for sensor-data-processor invocation..."
deadline=$((SECONDS + wait_seconds))
while (( SECONDS < deadline )); do
  count="$(aws logs filter-log-events \
    --region "${aws_region}" \
    --log-group-name "/aws/lambda/${function_name}" \
    --start-time "$(( ( $(date +%s) - wait_seconds ) * 1000 ))" \
    --filter-pattern '"LED sync request processed"' \
    --query 'length(events)' \
    --output text \
    --no-cli-pager 2>/dev/null || echo 0)"

  if [[ "${count}" != "0" && "${count}" != "None" ]]; then
    echo "sensor-data-processor handled LED sync-request."
    exit 0
  fi

  sleep 2
done

echo "Timed out waiting for LED sync lambda logs." >&2
echo "Check: IoT rule led_sync_request, lambda IAM (iot:Publish), REDIS_URL, IOT_DATA_ENDPOINT." >&2
exit 1

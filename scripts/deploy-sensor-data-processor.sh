#!/usr/bin/env bash
set -euo pipefail

environment="${1:-dev}"
aws_region="${AWS_REGION:-us-east-2}"

if [[ "${environment}" != "dev" && "${environment}" != "staging" ]]; then
  echo "Unsupported environment: ${environment} (use dev or staging)" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
function_name="${SENSOR_DATA_PROCESSOR_FUNCTION_NAME:-polaris-${environment}-sensor-data-processor}"
dist_dir="${repo_root}/lambdas/sensor-data-processor/dist"
zip_path="${repo_root}/lambdas/sensor-data-processor/.deploy/${function_name}.zip"

echo "Building sensor-data-processor..."
cd "${repo_root}"
pnpm --filter @polaris/sensor-data-processor build

if [[ ! -f "${dist_dir}/index.js" ]]; then
  echo "Build output not found at ${dist_dir}/index.js" >&2
  exit 1
fi

mkdir -p "$(dirname "${zip_path}")"
rm -f "${zip_path}"
(
  cd "${dist_dir}"
  zip -qr "${zip_path}" .
)

echo "Updating Lambda ${function_name} in ${aws_region}..."
aws lambda update-function-code \
  --region "${aws_region}" \
  --function-name "${function_name}" \
  --zip-file "fileb://${zip_path}" \
  --no-cli-pager

echo "Waiting for Lambda update..."
aws lambda wait function-updated \
  --region "${aws_region}" \
  --function-name "${function_name}"

echo "Done. Verify env vars:"
aws lambda get-function-configuration \
  --region "${aws_region}" \
  --function-name "${function_name}" \
  --query 'Environment.Variables.{LED:LED_COMMANDS_ENABLED,IOT:IOT_DATA_ENDPOINT,REDIS:REDIS_URL}' \
  --output table \
  --no-cli-pager

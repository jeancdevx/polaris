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

function_name="$(terraform output -raw api_gateway_private_smoke_function_name)"

echo "Invoking ${function_name}..."

aws lambda invoke \
  --function-name "$function_name" \
  --cli-binary-format raw-in-base64-out \
  --payload '{}' \
  "$output_file" \
  >/dev/null

cat "$output_file"
echo

if jq -e '.adminUnauthorizedStatus == 401' "$output_file" >/dev/null 2>&1; then
  echo "Private API Gateway smoke test passed."
  exit 0
fi

echo "Private API Gateway smoke test failed." >&2
exit 1

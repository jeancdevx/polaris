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

function_name="$(terraform output -raw kafka_msk_smoke_function_name)"

echo "Invoking ${function_name}..."

aws lambda invoke \
  --function-name "$function_name" \
  --cli-binary-format raw-in-base64-out \
  --payload '{}' \
  "$output_file" \
  >/dev/null

cat "$output_file"
echo

jq -e '.status == "passed"' "$output_file" >/dev/null
echo "MSK IAM smoke test passed."

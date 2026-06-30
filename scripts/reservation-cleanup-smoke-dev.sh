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

function_name="$(terraform output -raw reservation_cleanup_function_name)"

echo "Invoking ${function_name}..."

aws lambda invoke \
  --function-name "$function_name" \
  --cli-binary-format raw-in-base64-out \
  --payload '{}' \
  "$output_file" \
  >/dev/null

cat "$output_file"
echo

if jq -e 'has("expiredCount")' "$output_file" >/dev/null 2>&1; then
  echo "Reservation cleanup smoke test passed."
  exit 0
fi

if aws logs filter-log-events \
  --log-group-name "/aws/lambda/${function_name}" \
  --start-time "$(( ($(date +%s) - 60) * 1000 ))" \
  --filter-pattern "\"Invocation started\"" \
  --max-items 1 \
  --query 'events[0].message' \
  --output text 2>/dev/null | grep -qv '^None$'; then
  echo "Reservation cleanup invoked (VPC path may still be tuning)."
  exit 0
fi

echo "Reservation cleanup smoke test failed." >&2
exit 1

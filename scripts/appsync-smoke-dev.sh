#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"
response_file="$(mktemp)"

cleanup() {
  rm -f "$response_file"
}

trap cleanup EXIT

cd "$dev_dir"

endpoint="$(terraform output -raw appsync_graphql_endpoint)"
api_key="$(terraform output -raw appsync_api_key)"

echo "Querying AppSync availability at ${endpoint}..."

curl -sS -X POST "$endpoint" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${api_key}" \
  -d '{"query":"query { availability { totalSpots totalAvailable totalOccupied totalReserved updatedAt spots { spotId zone status } } }"}' \
  >"$response_file"

cat "$response_file"
echo

if jq -e '.data.availability.totalSpots >= 1' "$response_file" >/dev/null 2>&1; then
  echo "AppSync availability smoke test passed."
  exit 0
fi

if jq -e '.errors' "$response_file" >/dev/null 2>&1; then
  echo "AppSync returned GraphQL errors." >&2
  exit 1
fi

echo "AppSync availability smoke test failed." >&2
exit 1

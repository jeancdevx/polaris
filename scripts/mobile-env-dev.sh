#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"
env_file="${repo_root}/apps/mobile/.env"

cd "$dev_dir"

cat >"$env_file" <<EOF
EXPO_PUBLIC_API_URL=$(terraform output -raw api_gateway_endpoint)
EXPO_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT=$(terraform output -raw appsync_graphql_endpoint)
EXPO_PUBLIC_APPSYNC_REALTIME_ENDPOINT=$(terraform output -raw appsync_realtime_endpoint)
EXPO_PUBLIC_AWS_REGION=us-east-2
EOF

echo "Wrote ${env_file}"

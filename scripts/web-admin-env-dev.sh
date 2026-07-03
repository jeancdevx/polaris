#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"
env_file="${repo_root}/apps/web-admin/.env.local"

cd "$dev_dir"

cat >"$env_file" <<EOF
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT=$(terraform output -raw appsync_graphql_endpoint)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
NEXT_PUBLIC_COGNITO_CLIENT_ID=$(terraform output -raw cognito_app_client_id)
ADMIN_API_URL=http://127.0.0.1:3004
EOF

echo "Wrote ${env_file}"
echo "ADMIN_API_URL apunta al admin-service local (puerto 3004). Ejecuta: pnpm dev --filter admin-service"

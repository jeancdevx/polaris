#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"

cd "$dev_dir"

export APPSYNC_GRAPHQL_ENDPOINT="$(terraform output -raw appsync_graphql_endpoint)"
export APPSYNC_REALTIME_ENDPOINT="$(terraform output -raw appsync_realtime_endpoint)"
export APPSYNC_API_KEY="$(terraform output -raw appsync_api_key)"
export APPSYNC_OCCUPANCY_PUBLISHER_FUNCTION_NAME="$(terraform output -raw appsync_occupancy_publisher_function_name)"

node "${repo_root}/scripts/appsync-subscription-smoke.mjs"

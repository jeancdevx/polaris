#!/usr/bin/env bash
set -euo pipefail

environment="${1:?Usage: deploy-web-admin.sh <staging|prod>}"

if [[ "${environment}" != "staging" && "${environment}" != "prod" ]]; then
  echo "Unsupported environment: ${environment} (use staging or prod)" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
aws_region="${AWS_REGION:-us-east-2}"
account_id="$(aws sts get-caller-identity --query Account --output text)"
bucket="${WEB_ADMIN_S3_BUCKET:-polaris-assets-${environment}-${account_id}}"
prefix="${WEB_ADMIN_S3_PREFIX:-web-admin}"
dist_id="${WEB_CLOUDFRONT_DISTRIBUTION_ID:-}"
out_dir="${repo_root}/apps/web-admin/out"

required_vars=(
  NEXT_PUBLIC_ADMIN_API_URL
  NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT
  NEXT_PUBLIC_COGNITO_USER_POOL_ID
  NEXT_PUBLIC_COGNITO_CLIENT_ID
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "Missing required env var: ${var}" >&2
    exit 1
  fi
done

export NEXT_OUTPUT=export
export NEXT_PUBLIC_AWS_REGION="${NEXT_PUBLIC_AWS_REGION:-${aws_region}}"

cd "${repo_root}"
pnpm --filter web-admin build

if [ ! -d "${out_dir}" ]; then
  echo "Build output not found at ${out_dir}" >&2
  exit 1
fi

echo "Syncing ${out_dir} → s3://${bucket}/${prefix}/"
aws s3 sync "${out_dir}/" "s3://${bucket}/${prefix}/" \
  --delete \
  --region "${aws_region}" \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "*.html"

find "${out_dir}" -name '*.html' -print0 | while IFS= read -r -d '' file; do
  rel="${file#"${out_dir}/"}"
  aws s3 cp "${file}" "s3://${bucket}/${prefix}/${rel}" \
    --region "${aws_region}" \
    --cache-control "public,max-age=0,must-revalidate" \
    --content-type "text/html; charset=utf-8"
done

if [ -z "${dist_id}" ]; then
  echo "WEB_CLOUDFRONT_DISTRIBUTION_ID is required for ${environment}" >&2
  exit 1
fi

echo "Invalidating CloudFront distribution ${dist_id}"
aws cloudfront create-invalidation \
  --distribution-id "${dist_id}" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text

echo "Web-admin deployed to s3://${bucket}/${prefix}/"

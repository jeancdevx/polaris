#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

aws_region="${AWS_REGION:-us-east-2}"
project_name="${PROJECT_NAME:-polaris}"
environment="${ENVIRONMENT:-dev}"
repository_name="${project_name}-${environment}-admin-service"
image_tag="${IMAGE_TAG:-latest}"
local_image="${LOCAL_IMAGE:-polaris-admin-service:${image_tag}}"

account_id="$(aws sts get-caller-identity --query Account --output text)"
registry="${account_id}.dkr.ecr.${aws_region}.amazonaws.com"
remote_image="${registry}/${repository_name}:${image_tag}"

if ! aws ecr describe-repositories --repository-names "$repository_name" --region "$aws_region" >/dev/null 2>&1; then
  echo "Creating ECR repository ${repository_name}..."
  aws ecr create-repository \
    --repository-name "$repository_name" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --region "$aws_region" \
    >/dev/null
fi

echo "Building ${local_image}..."
docker build -f "${repo_root}/apps/admin-service/Dockerfile" -t "$local_image" "$repo_root"

echo "Logging in to ${registry}..."
aws ecr get-login-password --region "$aws_region" | docker login --username AWS --password-stdin "$registry"

docker tag "$local_image" "$remote_image"

echo "Pushing ${remote_image}..."
docker push "$remote_image"

echo "Pushed ${remote_image}"

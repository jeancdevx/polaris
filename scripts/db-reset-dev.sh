#!/usr/bin/env bash
set -euo pipefail

# Vacía RDS dev (tablas de app), re-seedea y sincroniza Redis.
#
# Preferido: GitHub Actions → "DB reset dev" → confirm: reset-dev
#
# Local:
#   pnpm db:reset:dev              # build, push imagen y ejecuta task ECS
#   SKIP_PUSH=1 pnpm db:reset:dev  # solo ejecuta task (imagen :latest ya en ECR)

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

aws_region="${AWS_REGION:-us-east-2}"
project_name="${PROJECT_NAME:-polaris}"
environment="${ENVIRONMENT:-dev}"
name_prefix="${project_name}-${environment}"
image_tag="${IMAGE_TAG:-latest}"

account_id="$(aws sts get-caller-identity --query Account --output text)"
registry="${account_id}.dkr.ecr.${aws_region}.amazonaws.com"
remote_image="${registry}/${name_prefix}-db-bootstrap:${image_tag}"

if [ "${SKIP_PUSH:-0}" != "1" ]; then
  IMAGE_TAG="$image_tag" bash "${repo_root}/scripts/push-db-bootstrap-ecr-dev.sh"
fi

echo "Registering task definition with image ${remote_image}..."

family="${name_prefix}-db-bootstrap"

current_def="$(aws ecs describe-task-definition \
  --task-definition "$family" \
  --query 'taskDefinition' \
  --output json)"

new_def="$(echo "$current_def" | jq \
  --arg IMAGE "$remote_image" \
  '.containerDefinitions[0].image = $IMAGE
   | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')"

revision="$(aws ecs register-task-definition \
  --cli-input-json "$new_def" \
  --query 'taskDefinition.revision' \
  --output text)"

echo "Registered ${family}:${revision}"

subnets="$(aws ec2 describe-subnets \
  --filters "Name=tag:Name,Values=${name_prefix}-private-*" \
  --query 'Subnets[*].SubnetId' \
  --output text | tr '\t' ',')"

sg="$(aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=${name_prefix}-ecs-sg" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)"

echo "Running dev reset task (TRUNCATE + seed + Redis flush/sync)..."

# Auth uses live DB_* secrets from the task definition (RDS master secret).
# Do not override DATABASE_URL — ECS secrets beat RunTask env overrides.
task_arn="$(aws ecs run-task \
  --cluster "${name_prefix}-cluster" \
  --task-definition "${family}:${revision}" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[${subnets}],securityGroups=[${sg}],assignPublicIp=DISABLED}" \
  --overrides "$(jq -n \
    --arg cmd0 "node" \
    --arg cmd1 "dist/reset.js" \
    '{containerOverrides:[{name:"db-bootstrap",command:[$cmd0,$cmd1]}]}')" \
  --query 'tasks[0].taskArn' \
  --output text)"

echo "Task: ${task_arn}"

aws ecs wait tasks-stopped \
  --cluster "${name_prefix}-cluster" \
  --tasks "$task_arn"

exit_code="$(aws ecs describe-tasks \
  --cluster "${name_prefix}-cluster" \
  --tasks "$task_arn" \
  --query 'tasks[0].containers[0].exitCode' \
  --output text)"

stop_reason="$(aws ecs describe-tasks \
  --cluster "${name_prefix}-cluster" \
  --tasks "$task_arn" \
  --query 'tasks[0].stoppedReason' \
  --output text)"

echo "Exit code: ${exit_code}"
echo "Stop reason: ${stop_reason}"

aws logs tail "/ecs/${family}" --since 15m || true

if [ "$exit_code" != "0" ]; then
  echo "db-reset-dev failed (exit ${exit_code})" >&2
  exit 1
fi

echo ""
echo "Dev reset OK — RDS con seed (usr-admin01, usr-12345, 10 plazas free) y Redis sincronizado."
echo "Cognito no se borra; usuarios existentes en el pool siguen válidos."
echo "Admin password: aws secretsmanager get-secret-value --secret-id ${name_prefix}-db-bootstrap-env --query SecretString --output text | jq -r .BOOTSTRAP_ADMIN_PASSWORD"

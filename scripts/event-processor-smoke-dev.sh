#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"

cd "$dev_dir"

cluster_name="$(terraform output -raw api_service_ecs_cluster_name)"
service_name="$(terraform output -raw event_processor_service_ecs_service_name)"
log_group="$(terraform output -raw event_processor_service_log_group_name)"
consumer_group="${KAFKA_CONSUMER_GROUP_ID:-event-processor-service}"
wait_seconds="${EVENT_PROCESSOR_SMOKE_WAIT_SECONDS:-120}"

echo "Checking ECS service ${service_name} in cluster ${cluster_name}..."

describe_services() {
  aws ecs describe-services \
    --cluster "$cluster_name" \
    --services "$service_name" \
    --query 'services[0]' \
    --output json
}

service_json="$(describe_services)"
running_count="$(echo "$service_json" | jq -r '.runningCount')"
desired_count="$(echo "$service_json" | jq -r '.desiredCount')"
deployment_status="$(echo "$service_json" | jq -r '.deployments[0].rolloutState // "UNKNOWN"')"

if [[ "$running_count" -lt 1 ]]; then
  echo "No running tasks yet (running=${running_count}, desired=${desired_count})." >&2
  exit 1
fi

if [[ "$running_count" != "$desired_count" ]]; then
  echo "Service not stable yet (running=${running_count}, desired=${desired_count})." >&2
  exit 1
fi

if [[ "$deployment_status" != "COMPLETED" ]]; then
  echo "Deployment rollout not completed (state=${deployment_status})." >&2
  exit 1
fi

echo "ECS service stable: ${running_count}/${desired_count} tasks, rollout ${deployment_status}."

start_ms="$(( ($(date +%s) - wait_seconds) * 1000 ))"
echo "Looking for consumer group join logs in ${log_group}..."

for _ in $(seq 1 "$((wait_seconds / 5))"); do
  join_count="$(aws logs filter-log-events \
    --log-group-name "$log_group" \
    --start-time "$start_ms" \
    --filter-pattern "\"Joined consumer group ${consumer_group}\"" \
    --query 'length(events)' \
    --output text 2>/dev/null || echo "0")"

  if [[ "$join_count" =~ ^[0-9]+$ ]] && [[ "$join_count" -ge 1 ]]; then
    echo "Consumer group ${consumer_group} joined (${join_count} log event(s))."
    echo "Event-processor smoke test passed."
    exit 0
  fi

  sleep 5
done

echo "Timed out waiting for consumer group ${consumer_group} join logs." >&2
echo "Check task logs: aws logs tail ${log_group} --since 10m" >&2
exit 1

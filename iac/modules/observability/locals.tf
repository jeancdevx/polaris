locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "observability"
    }
  )

  alarm_actions = var.sns_alerts_topic_arn != "" ? [var.sns_alerts_topic_arn] : []

  ecs_cpu_alarms = {
    for service in var.ecs_service_names : service => service
  }

  lambda_error_alarms = {
    for name in var.lambda_function_names : name => name
  }

  sqs_dlq_alarms = {
    for name in var.sqs_dlq_queue_names : name => name
  }

  kafka_brokers = {
    for broker_id in range(var.kafka_broker_count) : tostring(broker_id + 1) => tostring(broker_id + 1)
  }

  redis_cache_clusters = {
    for cluster_id in var.redis_cache_cluster_ids : cluster_id => cluster_id
  }
}

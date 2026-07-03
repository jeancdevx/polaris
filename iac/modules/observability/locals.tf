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
}

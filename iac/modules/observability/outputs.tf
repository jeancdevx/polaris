output "dashboard_system_name" {
  description = "CloudWatch system dashboard name"
  value       = var.enable_dashboards ? aws_cloudwatch_dashboard.system[0].dashboard_name : null
}

output "ecs_cpu_alarm_names" {
  description = "ECS CPU CloudWatch alarm names by service"
  value       = { for key, alarm in aws_cloudwatch_metric_alarm.ecs_cpu_high : key => alarm.alarm_name }
}

output "alarm_count" {
  description = "Total number of CloudWatch alarms created by this module"
  value = (
    length(aws_cloudwatch_metric_alarm.ecs_cpu_high) +
    length(aws_cloudwatch_metric_alarm.alb_unhealthy_hosts) +
    length(aws_cloudwatch_metric_alarm.alb_target_5xx) +
    length(aws_cloudwatch_metric_alarm.api_gateway_5xx) +
    length(aws_cloudwatch_metric_alarm.appsync_5xx) +
    length(aws_cloudwatch_metric_alarm.rds_cpu_high) +
    length(aws_cloudwatch_metric_alarm.lambda_errors) +
    length(aws_cloudwatch_metric_alarm.sqs_dlq_messages)
  )
}

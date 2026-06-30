output "health_checker_schedule_rule_name" {
  description = "EventBridge schedule rule name for health-checker"
  value       = aws_cloudwatch_event_rule.health_checker_schedule.name
}

output "notification_sender_rule_names" {
  description = "EventBridge rule names that target notification-sender"
  value = {
    for key, rule in aws_cloudwatch_event_rule.notification_sender :
    key => rule.name
  }
}

output "reservation_cleanup_schedule_rule_name" {
  description = "EventBridge schedule rule name for reservation-cleanup"
  value       = aws_cloudwatch_event_rule.reservation_cleanup_schedule.name
}

output "audit_logger_rule_arns" {
  description = "EventBridge rule ARNs that target audit-logger, keyed by rule key"
  value = {
    for key, rule in aws_cloudwatch_event_rule.audit_logger :
    key => rule.arn
  }
}

output "audit_logger_rule_names" {
  description = "EventBridge rule names that target audit-logger, keyed by rule key"
  value = {
    for key, rule in aws_cloudwatch_event_rule.audit_logger :
    key => rule.name
  }
}

output "bus_arn" {
  description = "ARN of the custom EventBridge bus"
  value       = aws_cloudwatch_event_bus.main.arn
}

output "bus_name" {
  description = "Name of the custom EventBridge bus"
  value       = aws_cloudwatch_event_bus.main.name
}

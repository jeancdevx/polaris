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

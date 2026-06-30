output "alerts_topic_arn" {
  description = "ARN of the operational alerts SNS topic"
  value       = aws_sns_topic.alerts.arn
}

output "alerts_topic_name" {
  description = "Name of the operational alerts SNS topic"
  value       = aws_sns_topic.alerts.name
}

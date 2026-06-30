output "function_arn" {
  description = "ARN of the notification-sender Lambda function"
  value       = aws_lambda_function.main.arn
}

output "function_name" {
  description = "Name of the notification-sender Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "log_group_name" {
  description = "CloudWatch log group for the notification-sender Lambda"
  value       = aws_cloudwatch_log_group.main.name
}

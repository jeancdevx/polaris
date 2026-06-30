output "function_arn" {
  description = "ARN of the health-checker Lambda function"
  value       = aws_lambda_function.main.arn
}

output "function_name" {
  description = "Name of the health-checker Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "log_group_name" {
  description = "CloudWatch log group for the health-checker Lambda"
  value       = aws_cloudwatch_log_group.main.name
}

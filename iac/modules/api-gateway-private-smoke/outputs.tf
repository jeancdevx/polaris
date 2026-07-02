output "function_arn" {
  description = "ARN of the api-gateway-private-smoke Lambda function"
  value       = aws_lambda_function.main.arn
}

output "function_name" {
  description = "Name of the api-gateway-private-smoke Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "log_group_name" {
  description = "CloudWatch log group for the api-gateway-private-smoke Lambda"
  value       = aws_cloudwatch_log_group.main.name
}

output "audit_log_group_name" {
  description = "CloudWatch log group used for structured audit records"
  value       = aws_cloudwatch_log_group.audit.name
}

output "function_arn" {
  description = "ARN of the audit-logger Lambda function"
  value       = aws_lambda_function.main.arn
}

output "function_name" {
  description = "Name of the audit-logger Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "log_group_name" {
  description = "CloudWatch log group for Lambda execution logs"
  value       = aws_cloudwatch_log_group.lambda.name
}

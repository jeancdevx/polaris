output "function_arn" {
  description = "ARN of the kafka-topic-creator Lambda function"
  value       = aws_lambda_function.main.arn
}

output "function_name" {
  description = "Name of the kafka-topic-creator Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "invocation_result" {
  description = "Result payload from the topic creation invocation when invoke_on_deploy is enabled"
  value       = try(jsondecode(aws_lambda_invocation.create_topics[0].result), null)
  sensitive   = true
}

output "log_group_name" {
  description = "CloudWatch log group for the kafka-topic-creator Lambda"
  value       = aws_cloudwatch_log_group.main.name
}

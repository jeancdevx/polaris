output "kafka_ui_task_role_arn" {
  description = "ARN of the Kafka UI task IAM role"
  value       = aws_iam_role.kafka_ui_task.arn
}

output "lambda_role_arns" {
  description = "Map of IAM role ARNs for Lambda functions"
  value = {
    for k, v in aws_iam_role.lambda : k => v.arn
  }
}

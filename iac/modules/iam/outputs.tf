output "kafka_ui_task_role_arn" {
  description = "ARN of the Kafka UI task IAM role"
  value       = aws_iam_role.kafka_ui_task.arn
}

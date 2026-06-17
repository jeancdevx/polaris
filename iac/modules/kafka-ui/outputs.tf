output "security_group_id" {
  description = "Security group ID of the Kafka UI task"
  value       = aws_security_group.kafka_ui.id
}

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.main.arn
}

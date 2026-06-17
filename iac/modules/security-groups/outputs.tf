output "msk_security_group_id" {
  description = "Security group ID for MSK cluster"
  value       = aws_security_group.msk.id
}

output "ecs_services_security_group_id" {
  description = "Security group ID for ECS services"
  value       = aws_security_group.ecs_services.id
}

output "msk_security_group_id" {
  description = "Security group ID for MSK cluster"
  value       = aws_security_group.msk.id
}

output "ecs_services_security_group_id" {
  description = "Security group ID for ECS services"
  value       = aws_security_group.ecs_services.id
}

output "lambda_security_group_ids" {
  description = "Map of security group IDs for Lambda functions"
  value = {
    for k, v in aws_security_group.lambda : k => v.id
  }
}

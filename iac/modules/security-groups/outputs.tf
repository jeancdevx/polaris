output "alb_security_group_id" {
  description = "Security group ID for the application load balancer"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "Security group ID for ECS Fargate tasks"
  value       = aws_security_group.ecs.id
}

output "lambda_security_group_id" {
  description = "Security group ID for VPC-enabled Lambda functions"
  value       = aws_security_group.lambda.id
}

output "msk_security_group_id" {
  description = "Security group ID for Amazon MSK brokers"
  value       = aws_security_group.msk.id
}

output "rds_security_group_id" {
  description = "Security group ID for Aurora PostgreSQL"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "Security group ID for ElastiCache Redis"
  value       = aws_security_group.redis.id
}

output "security_group_ids" {
  description = "Map of security group names to IDs"
  value = {
    alb    = aws_security_group.alb.id
    ecs    = aws_security_group.ecs.id
    lambda = aws_security_group.lambda.id
    msk    = aws_security_group.msk.id
    rds    = aws_security_group.rds.id
    redis  = aws_security_group.redis.id
  }
}

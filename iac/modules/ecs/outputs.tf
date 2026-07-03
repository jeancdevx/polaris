output "alb_arn" {
  description = "Application load balancer ARN"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ALB ARN suffix for CloudWatch ApplicationELB dimensions"
  value       = aws_lb.main.arn_suffix
}

output "alb_target_group_arn_suffixes" {
  description = "ALB target group ARN suffixes for CloudWatch alarms (map keys are stable at plan time)"
  value = {
    api_service         = aws_lb_target_group.api_service.arn_suffix
    admin_service       = aws_lb_target_group.admin_service.arn_suffix
    reservation_service = aws_lb_target_group.reservation_service.arn_suffix
  }
}

output "api_service_name" {
  description = "ECS service name for api-service"
  value       = local.api_service_name
}

output "admin_service_name" {
  description = "ECS service name for admin-service"
  value       = local.admin_service_name
}

output "reservation_service_name" {
  description = "ECS service name for reservation-service"
  value       = local.reservation_service_name
}

output "ecs_service_names" {
  description = "ECS service names behind the ALB and internal processors"
  value = [
    local.api_service_name,
    local.admin_service_name,
    local.reservation_service_name,
    local.event_processor_service_name,
  ]
}

output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_listener_arn" {
  description = "ARN of the ALB HTTP listener for API Gateway VPC Link integration"
  value       = aws_lb_listener.http.arn
}

output "alb_zone_id" {
  description = "Route53 zone ID of the application load balancer"
  value       = aws_lb.main.zone_id
}

output "admin_service_env_secret_arn" {
  description = "Secrets Manager ARN with DATABASE_URL, REDIS_URL and RFID_VALIDATIONS_TABLE_NAME for admin-service"
  value       = aws_secretsmanager_secret.admin_service_env.arn
  sensitive   = true
}

output "admin_service_log_group_name" {
  description = "CloudWatch log group for admin-service ECS tasks"
  value       = aws_cloudwatch_log_group.admin_service.name
}

output "admin_service_target_group_arn" {
  description = "Target group ARN for admin-service"
  value       = aws_lb_target_group.admin_service.arn
}

output "admin_service_task_definition_arn" {
  description = "Task definition ARN for admin-service"
  value       = aws_ecs_task_definition.admin_service.arn
}

output "api_service_env_secret_arn" {
  description = "Secrets Manager ARN with DATABASE_URL and REDIS_URL for api-service"
  value       = aws_secretsmanager_secret.api_service_env.arn
  sensitive   = true
}

output "api_service_log_group_name" {
  description = "CloudWatch log group for api-service ECS tasks"
  value       = aws_cloudwatch_log_group.api_service.name
}

output "api_service_target_group_arn" {
  description = "Target group ARN for api-service"
  value       = aws_lb_target_group.api_service.arn
}

output "api_service_task_definition_arn" {
  description = "Task definition ARN for api-service"
  value       = aws_ecs_task_definition.api_service.arn
}

output "reservation_service_env_secret_arn" {
  description = "Secrets Manager ARN with DATABASE_URL, REDIS_URL and KAFKA_BROKERS for reservation-service"
  value       = aws_secretsmanager_secret.reservation_service_env.arn
  sensitive   = true
}

output "reservation_service_log_group_name" {
  description = "CloudWatch log group for reservation-service ECS tasks"
  value       = aws_cloudwatch_log_group.reservation_service.name
}

output "reservation_service_target_group_arn" {
  description = "Target group ARN for reservation-service"
  value       = aws_lb_target_group.reservation_service.arn
}

output "reservation_service_task_definition_arn" {
  description = "Task definition ARN for reservation-service"
  value       = aws_ecs_task_definition.reservation_service.arn
}

output "event_processor_service_env_secret_arn" {
  description = "Secrets Manager ARN with DATABASE_URL, REDIS_URL and KAFKA_BROKERS for event-processor-service"
  value       = aws_secretsmanager_secret.event_processor_service_env.arn
  sensitive   = true
}

output "event_processor_service_log_group_name" {
  description = "CloudWatch log group for event-processor-service ECS tasks"
  value       = aws_cloudwatch_log_group.event_processor_service.name
}

output "event_processor_service_name" {
  description = "ECS service name for event-processor-service"
  value       = aws_ecs_service.event_processor_service.name
}

output "event_processor_service_task_definition_arn" {
  description = "Task definition ARN for event-processor-service"
  value       = aws_ecs_task_definition.event_processor_service.arn
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "db_bootstrap_log_group_name" {
  description = "CloudWatch log group for db-bootstrap ECS tasks"
  value       = aws_cloudwatch_log_group.db_bootstrap.name
}

output "db_bootstrap_task_definition_arn" {
  description = "Task definition ARN for db-bootstrap one-shot tasks"
  value       = aws_ecs_task_definition.db_bootstrap.arn
}

output "db_bootstrap_task_definition_family" {
  description = "Task definition family for db-bootstrap one-shot tasks"
  value       = aws_ecs_task_definition.db_bootstrap.family
}

output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = var.enable_cluster ? aws_ecs_cluster.main[0].id : null
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = local.cluster_name
}

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = var.enable_cluster ? aws_ecs_cluster.main[0].arn : null
}

output "service_arns" {
  description = "Map of ECS service ARNs"
  value = {
    for k, v in aws_ecs_service.services : k => v.id
  }
}

output "task_definition_arns" {
  description = "Map of task definition ARNs"
  value = {
    for k, v in aws_ecs_task_definition.services : k => v.arn
  }
}

output "alb_arn" {
  description = "ARN of the ALB"
  value       = var.enable_alb ? aws_lb.main[0].arn : null
}

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = var.enable_alb ? aws_lb.main[0].dns_name : null
}

output "target_group_arns" {
  description = "Map of target group ARNs"
  value = {
    for k, v in aws_lb_target_group.services : k => v.arn
  }
}

output "listener_arns" {
  description = "ARNs of the ALB listeners"
  value = {
    http  = var.enable_alb ? aws_lb_listener.http[0].arn : null
    https = var.enable_alb && var.alb_certificate_arn != "" ? aws_lb_listener.https[0].arn : null
  }
}

output "security_group_ids" {
  description = "Security group IDs for ALB and ECS services"
  value = {
    alb      = var.enable_alb ? aws_security_group.alb[0].id : null
    services = aws_security_group.services[0].id
  }
}

output "task_execution_role_arn" {
  description = "ARN of the task execution IAM role"
  value       = var.task_execution_role_arn != "" ? var.task_execution_role_arn : aws_iam_role.task_execution[0].arn
}

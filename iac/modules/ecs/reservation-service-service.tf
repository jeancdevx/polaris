resource "aws_ecs_service" "reservation_service" {
  name            = local.reservation_service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.reservation_service.arn
  desired_count   = var.reservation_service_desired_count
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.reservation_service.arn
    container_name   = "reservation-service"
    container_port   = var.reservation_service_container_port
  }

  health_check_grace_period_seconds = 60

  tags = merge(local.common_tags, {
    Name    = local.reservation_service_name
    Service = "reservation-service"
  })

  depends_on = [
    aws_lb_listener_rule.reservation_reserve_post,
    aws_lb_listener_rule.reservation_reserve_delete,
    aws_secretsmanager_secret_version.reservation_service_env
  ]

  lifecycle {
    ignore_changes = [desired_count]
  }
}

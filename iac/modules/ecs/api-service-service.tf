resource "aws_ecs_service" "api_service" {
  name            = local.api_service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_service.arn
  desired_count   = var.api_service_desired_count
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_service.arn
    container_name   = "api-service"
    container_port   = var.container_port
  }

  health_check_grace_period_seconds = 60

  tags = merge(local.common_tags, {
    Name    = local.api_service_name
    Service = "api-service"
  })

  depends_on = [
    aws_lb_listener.http,
    aws_secretsmanager_secret_version.api_service_env
  ]

  lifecycle {
    ignore_changes = [desired_count]
  }
}

resource "aws_ecs_service" "services" {
  for_each = var.services

  name            = "${local.name}-${each.value.name}"
  cluster         = local.cluster_name
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = each.value.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.services[0].id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services[each.key].arn
    container_name   = each.value.container_name
    container_port   = each.value.container_port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name}-${each.value.name}"
    Service = each.value.name
  })

  depends_on = [
    aws_lb_listener.http,
    aws_lb_listener.https
  ]
}

resource "aws_ecs_service" "main" {
  name            = "${local.name}-kafka-ui"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.kafka_ui.id]
    assign_public_ip = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-kafka-ui"
  })
}

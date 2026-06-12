resource "aws_ecs_task_definition" "services" {
  for_each = var.services

  family                   = "${local.name}-${each.value.name}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = var.task_execution_role_arn != "" ? var.task_execution_role_arn : aws_iam_role.task_execution[0].arn

  container_definitions = jsonencode([
    {
      name      = each.value.container_name
      image     = each.value.container_image
      essential = true

      portMappings = [
        {
          containerPort = each.value.container_port
          hostPort      = each.value.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        for k, v in each.value.environment_vars : {
          name  = k
          value = v
        }
      ]

      secrets = each.value.secrets != null ? [
        for k, v in each.value.secrets : {
          name      = k
          valueFrom = v
        }
      ] : []

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = each.value.log_group_name != "" ? each.value.log_group_name : "/ecs/${each.value.name}"
          "awslogs-region"        = data.aws_region.current.region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = each.value.health_check_type == "http" ? {
        command     = ["CMD-SHELL", "curl -f http://localhost:${each.value.container_port}${each.value.health_check_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
        } : {
        command     = ["CMD-SHELL", "echo > /dev/tcp/localhost/${each.value.container_port} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = local.common_tags
}

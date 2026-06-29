resource "aws_ecs_task_definition" "api_service" {
  family                   = local.api_service_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_service_cpu
  memory                   = var.api_service_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_api_service_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "api-service"
      image     = "${var.ecr_repository_url}:${var.api_service_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.container_port) },
        { name = "HOST", value = "0.0.0.0" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "COGNITO_USER_POOL_ID", value = var.cognito_user_pool_id },
        { name = "COGNITO_CLIENT_ID", value = var.cognito_app_client_id },
        { name = "COGNITO_ISSUER_URL", value = var.cognito_issuer_url }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.api_service_env.arn}:DATABASE_URL::"
        },
        {
          name      = "REDIS_URL"
          valueFrom = "${aws_secretsmanager_secret.api_service_env.arn}:REDIS_URL::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.api_service.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "node --input-type=module -e \"fetch('http://127.0.0.1:${var.container_port}${var.health_check_path}').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))\""]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(local.common_tags, {
    Name    = local.api_service_name
    Service = "api-service"
  })
}

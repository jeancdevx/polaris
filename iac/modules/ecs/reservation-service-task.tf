resource "aws_ecs_task_definition" "reservation_service" {
  family                   = local.reservation_service_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.reservation_service_cpu
  memory                   = var.reservation_service_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_reservation_service_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "reservation-service"
      image     = "${var.reservation_service_ecr_repository_url}:${var.reservation_service_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.reservation_service_container_port
          hostPort      = var.reservation_service_container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.reservation_service_container_port) },
        { name = "HOST", value = "0.0.0.0" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "KAFKA_AUTH_MODE", value = "iam" },
        { name = "KAFKA_CLIENT_ID", value = "reservation-service" }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.reservation_service_env.arn}:DATABASE_URL::"
        },
        {
          name      = "REDIS_URL"
          valueFrom = "${aws_secretsmanager_secret.reservation_service_env.arn}:REDIS_URL::"
        },
        {
          name      = "KAFKA_BROKERS"
          valueFrom = "${aws_secretsmanager_secret.reservation_service_env.arn}:KAFKA_BROKERS::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.reservation_service.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "node --input-type=module -e \"fetch('http://127.0.0.1:${var.reservation_service_container_port}${var.health_check_path}').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))\""]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(local.common_tags, {
    Name    = local.reservation_service_name
    Service = "reservation-service"
  })
}

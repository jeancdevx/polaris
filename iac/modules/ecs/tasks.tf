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

      environment = concat([
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.container_port) },
        { name = "HOST", value = "0.0.0.0" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "COGNITO_USER_POOL_ID", value = var.cognito_user_pool_id },
        { name = "COGNITO_CLIENT_ID", value = var.cognito_app_client_id },
        { name = "COGNITO_ISSUER_URL", value = var.cognito_issuer_url }
      ], local.database_environment)

      secrets = concat([
        {
          name      = "REDIS_URL"
          valueFrom = "${aws_secretsmanager_secret.api_service_env.arn}:REDIS_URL::"
        }
      ], local.database_credential_secrets)

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

resource "aws_ecs_task_definition" "admin_service" {
  family                   = local.admin_service_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.admin_service_cpu
  memory                   = var.admin_service_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_admin_service_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "admin-service"
      image     = "${var.admin_service_ecr_repository_url}:${var.admin_service_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.admin_service_container_port
          hostPort      = var.admin_service_container_port
          protocol      = "tcp"
        }
      ]

      environment = concat([
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.admin_service_container_port) },
        { name = "HOST", value = "0.0.0.0" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "COGNITO_USER_POOL_ID", value = var.cognito_user_pool_id }
      ], local.database_environment)

      secrets = concat([
        {
          name      = "REDIS_URL"
          valueFrom = "${aws_secretsmanager_secret.admin_service_env.arn}:REDIS_URL::"
        },
        {
          name      = "RFID_VALIDATIONS_TABLE_NAME"
          valueFrom = "${aws_secretsmanager_secret.admin_service_env.arn}:RFID_VALIDATIONS_TABLE_NAME::"
        }
      ], local.database_credential_secrets)

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.admin_service.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "node --input-type=module -e \"fetch('http://127.0.0.1:${var.admin_service_container_port}${var.health_check_path}').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))\""]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(local.common_tags, {
    Name    = local.admin_service_name
    Service = "admin-service"
  })
}

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

      environment = concat([
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.reservation_service_container_port) },
        { name = "HOST", value = "0.0.0.0" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "KAFKA_AUTH_MODE", value = "iam" },
        { name = "KAFKA_CLIENT_ID", value = "reservation-service" }
      ], local.database_environment)

      secrets = concat([
        {
          name      = "REDIS_URL"
          valueFrom = "${aws_secretsmanager_secret.reservation_service_env.arn}:REDIS_URL::"
        },
        {
          name      = "KAFKA_BROKERS"
          valueFrom = "${aws_secretsmanager_secret.reservation_service_env.arn}:KAFKA_BROKERS::"
        }
      ], local.database_credential_secrets)

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

resource "aws_ecs_task_definition" "event_processor_service" {
  family                   = local.event_processor_service_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.event_processor_service_cpu
  memory                   = var.event_processor_service_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_event_processor_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "event-processor-service"
      image     = "${var.event_processor_service_ecr_repository_url}:${var.event_processor_service_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.event_processor_service_container_port
          hostPort      = var.event_processor_service_container_port
          protocol      = "tcp"
        }
      ]

      environment = concat([
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.event_processor_service_container_port) },
        { name = "HOST", value = "0.0.0.0" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "KAFKA_AUTH_MODE", value = "iam" },
        { name = "KAFKA_CLIENT_ID", value = "event-processor-service" },
        { name = "KAFKA_CONSUMER_GROUP_ID", value = "event-processor-service" },
        { name = "EVENTBRIDGE_ENABLED", value = "true" },
        { name = "EVENTBRIDGE_BUS_NAME", value = var.eventbridge_bus_name },
        { name = "LED_COMMANDS_ENABLED", value = tostring(var.led_commands_enabled) },
        { name = "IOT_DATA_ENDPOINT", value = var.iot_data_endpoint }
      ], local.database_environment)

      secrets = concat([
        {
          name      = "REDIS_URL"
          valueFrom = "${aws_secretsmanager_secret.event_processor_service_env.arn}:REDIS_URL::"
        },
        {
          name      = "KAFKA_BROKERS"
          valueFrom = "${aws_secretsmanager_secret.event_processor_service_env.arn}:KAFKA_BROKERS::"
        }
      ], local.database_credential_secrets)

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.event_processor_service.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "node --input-type=module -e \"fetch('http://127.0.0.1:${var.event_processor_service_container_port}${var.health_check_path}/ready').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))\""]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 90
      }
    }
  ])

  tags = merge(local.common_tags, {
    Name    = local.event_processor_service_name
    Service = "event-processor-service"
  })
}

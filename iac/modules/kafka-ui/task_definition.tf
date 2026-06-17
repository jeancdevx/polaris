resource "aws_ecs_task_definition" "main" {
  family                   = "${local.name}-kafka-ui"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "kafka-ui"
      image     = var.container_image
      essential = true

      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "KAFKA_CLUSTERS_0_NAME"
          value = var.kafka_cluster_name
        },
        {
          name  = "KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS"
          value = var.kafka_bootstrap_servers
        },
        {
          name  = "KAFKA_CLUSTERS_0_PROPERTIES_SECURITY_PROTOCOL"
          value = "SASL_SSL"
        },
        {
          name  = "KAFKA_CLUSTERS_0_PROPERTIES_SASL_MECHANISM"
          value = "AWS_MSK_IAM"
        },
        {
          name  = "KAFKA_CLUSTERS_0_PROPERTIES_SASL_JAAS_CONFIG"
          value = "software.amazon.msk.auth.iam.IAMLoginModule required;"
        },
        {
          name  = "KAFKA_CLUSTERS_0_PROPERTIES_SASL_CLIENT_CALLBACK_HANDLER_CLASS"
          value = "software.amazon.msk.auth.iam.IAMClientCallbackHandler"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.main.name
          "awslogs-region"        = data.aws_region.current.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = local.common_tags
}

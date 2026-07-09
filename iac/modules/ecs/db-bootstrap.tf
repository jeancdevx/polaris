resource "random_password" "bootstrap_admin" {
  count = var.bootstrap_admin_password == null ? 1 : 0

  length  = 24
  special = true
}

resource "aws_cloudwatch_log_group" "db_bootstrap" {
  name              = "/ecs/${local.db_bootstrap_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name    = local.db_bootstrap_name
    Service = "db-bootstrap"
  })
}

resource "aws_secretsmanager_secret" "db_bootstrap_env" {
  name                    = "${local.name_prefix}-db-bootstrap-env"
  recovery_window_in_days = local.secret_recovery_window_days

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-db-bootstrap-env"
    Service = "db-bootstrap"
  })
}

resource "aws_secretsmanager_secret_version" "db_bootstrap_env" {
  secret_id = aws_secretsmanager_secret.db_bootstrap_env.id
  secret_string = jsonencode({
    REDIS_URL                = var.redis_url
    BOOTSTRAP_ADMIN_PASSWORD = local.bootstrap_admin_password
  })
}

resource "aws_ecs_task_definition" "db_bootstrap" {
  family                   = local.db_bootstrap_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.db_bootstrap_cpu
  memory                   = var.db_bootstrap_memory
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_db_bootstrap_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "db-bootstrap"
      image     = "${var.db_bootstrap_ecr_repository_url}:${var.db_bootstrap_image_tag}"
      essential = true

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "COGNITO_USER_POOL_ID", value = var.cognito_user_pool_id },
        { name = "BOOTSTRAP_ADMIN_EMAIL", value = var.bootstrap_admin_email },
        { name = "BOOTSTRAP_ADMIN_USER_ID", value = var.bootstrap_admin_user_id },
        { name = "DB_HOST", value = var.rds_cluster_endpoint },
        { name = "DB_PORT", value = tostring(var.rds_cluster_port) },
        { name = "DB_NAME", value = var.rds_database_name }
      ]

      secrets = [
        {
          name      = "DB_USERNAME"
          valueFrom = "${var.rds_master_user_secret_arn}:username::"
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = "${var.rds_master_user_secret_arn}:password::"
        },
        {
          name      = "REDIS_URL"
          valueFrom = "${aws_secretsmanager_secret.db_bootstrap_env.arn}:REDIS_URL::"
        },
        {
          name      = "BOOTSTRAP_ADMIN_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_bootstrap_env.arn}:BOOTSTRAP_ADMIN_PASSWORD::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.db_bootstrap.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = merge(local.common_tags, {
    Name    = local.db_bootstrap_name
    Service = "db-bootstrap"
  })
}

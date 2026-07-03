resource "aws_ecs_task_definition" "atlantis" {
  family                   = "${local.name_prefix}-atlantis"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = local.container_name
      image     = "ghcr.io/runatlantis/atlantis:v0.35.0"
      essential = true
      portMappings = [
        {
          containerPort = 4141
          hostPort      = 4141
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "ATLANTIS_ATLANTIS_URL", value = local.atlantis_url },
        { name = "ATLANTIS_REPO_ALLOWLIST", value = "github.com/${var.github_repository}" },
        { name = "ATLANTIS_DISABLE_APPLY_ALL", value = "true" },
        { name = "ATLANTIS_HIDE_PREV_PLAN_COMMENTS", value = "true" },
        { name = "ATLANTIS_GH_USER", value = "polaris-atlantis" },
        { name = "ATLANTIS_PORT", value = "4141" },
        { name = "ATLANTIS_DATA_DIR", value = "/atlantis-data" },
        { name = "TF_STATE_BUCKET", value = var.state_bucket_name },
        { name = "TF_STATE_KEY", value = var.state_key },
        { name = "AWS_DEFAULT_REGION", value = local.region }
      ]
      secrets = [
        {
          name      = "ATLANTIS_GH_TOKEN"
          valueFrom = "${aws_secretsmanager_secret.atlantis.arn}:github_token::"
        },
        {
          name      = "ATLANTIS_GH_WEBHOOK_SECRET"
          valueFrom = "${aws_secretsmanager_secret.atlantis.arn}:webhook_secret::"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.atlantis.name
          awslogs-region        = local.region
          awslogs-stream-prefix = "atlantis"
        }
      }
      readonlyRootFilesystem = false
    }
  ])

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis"
  })
}

resource "aws_ecs_service" "atlantis" {
  name            = "${local.name_prefix}-atlantis"
  cluster         = var.cluster_arn
  task_definition = aws_ecs_task_definition.atlantis.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.service.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.atlantis.arn
    container_name   = local.container_name
    container_port   = 4141
  }

  health_check_grace_period_seconds = 60

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis"
  })

  depends_on = [aws_lb_listener.https]
}

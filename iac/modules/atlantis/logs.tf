resource "aws_cloudwatch_log_group" "atlantis" {
  name              = "/ecs/${local.name_prefix}-atlantis"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis"
  })
}

resource "aws_secretsmanager_secret" "atlantis" {
  name                    = "${local.name_prefix}-atlantis"
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis"
  })
}

resource "aws_secretsmanager_secret_version" "atlantis" {
  secret_id = aws_secretsmanager_secret.atlantis.id

  secret_string = jsonencode({
    github_token   = var.github_token
    webhook_secret = local.webhook_secret
  })
}

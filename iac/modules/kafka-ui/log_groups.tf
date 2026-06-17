resource "aws_cloudwatch_log_group" "main" {
  name              = "/ecs/${local.name}-kafka-ui"
  retention_in_days = 30

  tags = local.common_tags
}

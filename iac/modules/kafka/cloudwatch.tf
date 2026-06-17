resource "aws_cloudwatch_log_group" "msk" {
  count = var.enable_cloudwatch_logs ? 1 : 0

  name              = "/aws/msk/${local.name}"
  retention_in_days = var.cloudwatch_log_group_retention_days

  tags = local.common_tags
}

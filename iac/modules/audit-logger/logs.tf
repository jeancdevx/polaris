resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = coalesce(var.log_retention_days, var.environment == "prod" ? 30 : 7)

  tags = merge(local.common_tags, {
    Name = "${local.function_name}-logs"
  })
}

resource "aws_cloudwatch_log_group" "audit" {
  name              = var.audit_log_group_name
  retention_in_days = coalesce(var.audit_log_retention_days, var.environment == "prod" ? 90 : 14)

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logs"
  })
}

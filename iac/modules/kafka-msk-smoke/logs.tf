resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = coalesce(var.log_retention_days, var.environment == "prod" ? 30 : 7)

  tags = merge(local.common_tags, {
    Name = "${local.function_name}-logs"
  })
}

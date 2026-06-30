resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.function_name}-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each = var.functions

  name              = "/aws/lambda/${local.name}-${each.value.function_name}"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name     = "${local.name}-${each.value.function_name}"
    Function = each.value.function_name
  })
}

resource "aws_lambda_function" "functions" {
  for_each = var.functions

  function_name = "${local.name}-${each.value.function_name}"
  description   = each.value.description
  role          = var.role_arns[each.key]
  handler       = each.value.handler
  runtime       = each.value.runtime
  timeout       = each.value.timeout
  memory_size   = each.value.memory_size

  filename         = "${path.module}/../../../.build/${each.value.function_name}.zip"
  source_code_hash = filebase64sha256("${path.module}/../../../.build/${each.value.function_name}.zip")

  environment {
    variables = merge(
      each.value.environment_vars,
      {
        for k, v in each.value.secrets : k => v
      }
    )
  }

  dynamic "vpc_config" {
    for_each = each.value.vpc_enabled ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = [var.security_group_ids[each.key]]
    }
  }

  tags = merge(local.common_tags, {
    Name     = "${local.name}-${each.value.function_name}"
    Function = each.value.function_name
  })

  depends_on = [
    aws_cloudwatch_log_group.lambda
  ]
}

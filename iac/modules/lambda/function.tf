resource "aws_lambda_function" "main" {
  function_name = var.function_name
  role          = var.lambda_role_arn
  handler       = var.handler
  runtime       = var.runtime
  timeout       = var.timeout_seconds
  memory_size   = var.memory_size

  filename         = var.filename
  source_code_hash = var.source_code_hash

  environment {
    variables = merge(
      {
        POWERTOOLS_LOG_LEVEL         = var.powertools_log_level
        POWERTOOLS_METRICS_NAMESPACE = var.powertools_metrics_namespace
        POWERTOOLS_SERVICE_NAME      = local.powertools_service_name
      },
      var.environment_variables
    )
  }

  dynamic "vpc_config" {
    for_each = local.use_vpc ? [1] : []

    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
  }

  tracing_config {
    mode = var.enable_xray_tracing ? "Active" : "PassThrough"
  }

  tags = merge(local.common_tags, {
    Name = var.function_name
  })

  depends_on = [
    aws_cloudwatch_log_group.main,
  ]
}

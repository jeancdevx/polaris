resource "aws_lambda_function" "main" {
  function_name = local.function_name
  role          = var.lambda_role_arn
  handler       = "index.handler"
  runtime       = "nodejs24.x"
  timeout       = var.timeout_seconds
  memory_size   = 256

  filename         = data.archive_file.lambda_package.output_path
  source_code_hash = data.archive_file.lambda_package.output_base64sha256

  environment {
    variables = {
      AUDIT_CLOUDWATCH_LOG_GROUP   = var.audit_log_group_name
      AUDIT_S3_BUCKET              = var.audit_logs_bucket_name
      AUDIT_S3_PREFIX              = var.audit_s3_prefix
      AUDIT_ARCHIVE_ENABLED        = "true"
      AUDIT_CLOUDWATCH_ENABLED     = "true"
      POWERTOOLS_LOG_LEVEL         = var.powertools_log_level
      POWERTOOLS_METRICS_NAMESPACE = "Polaris"
      POWERTOOLS_SERVICE_NAME      = local.function_name
    }
  }

  tracing_config {
    mode = var.enable_xray_tracing ? "Active" : "PassThrough"
  }

  tags = merge(local.common_tags, {
    Name = local.function_name
  })

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_cloudwatch_log_group.audit,
  ]
}

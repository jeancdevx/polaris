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
      DB_HOST                      = var.rds_cluster_endpoint
      DB_PORT                      = tostring(var.rds_cluster_port)
      DB_NAME                      = var.rds_database_name
      DB_SECRET_ARN                = var.rds_master_secret_arn
      REDIS_URL                    = var.redis_url
      EVENTBRIDGE_BUS_NAME         = var.eventbridge_bus_name
      EVENTBRIDGE_SOURCE           = "polaris.reservation-cleanup"
      KAFKA_BROKERS                = var.bootstrap_brokers
      KAFKA_AUTH_MODE              = "iam"
      KAFKA_CLIENT_ID              = local.function_name
      POWERTOOLS_LOG_LEVEL         = var.powertools_log_level
      POWERTOOLS_METRICS_NAMESPACE = "Polaris"
      POWERTOOLS_SERVICE_NAME      = local.function_name
    }
  }

  tracing_config {
    mode = var.enable_xray_tracing ? "Active" : "PassThrough"
  }

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  tags = merge(local.common_tags, {
    Name = local.function_name
  })

  depends_on = [
    aws_cloudwatch_log_group.main,
    aws_iam_role_policy.database_secret_read,
  ]
}

resource "aws_iam_role_policy" "database_secret_read" {
  name = "${local.function_name}-database-secret-read"
  role = basename(var.lambda_role_arn)
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = var.rds_master_secret_arn
    }]
  })
}

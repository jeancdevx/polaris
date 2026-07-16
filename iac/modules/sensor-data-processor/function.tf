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
    variables = merge(
      {
        SENSOR_READINGS_TABLE_NAME   = var.sensor_readings_table_name
        SENSOR_READINGS_TTL_DAYS     = tostring(var.sensor_readings_ttl_days)
        KAFKA_BROKERS                = var.bootstrap_brokers
        KAFKA_AUTH_MODE              = "iam"
        KAFKA_CLIENT_ID              = local.function_name
        POWERTOOLS_LOG_LEVEL         = var.powertools_log_level
        POWERTOOLS_METRICS_NAMESPACE = "Polaris"
        POWERTOOLS_SERVICE_NAME      = local.function_name
        LED_COMMANDS_ENABLED         = tostring(var.led_commands_enabled)
      },
      var.redis_url != null ? { REDIS_URL = var.redis_url } : {},
      var.rds_cluster_endpoint != null ? {
        DB_HOST       = var.rds_cluster_endpoint
        DB_PORT       = tostring(var.rds_cluster_port)
        DB_NAME       = var.rds_database_name
        DB_SECRET_ARN = var.rds_master_secret_arn
      } : {},
      var.led_commands_enabled ? {
        IOT_DATA_ENDPOINT = coalesce(
          var.iot_data_endpoint,
          data.aws_iot_endpoint.data_ats.endpoint_address
        )
      } : {}
    )
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
  ]
}

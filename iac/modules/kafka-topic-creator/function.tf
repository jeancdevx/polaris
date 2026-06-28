resource "aws_lambda_function" "main" {
  function_name = local.function_name
  role          = var.lambda_role_arn
  handler       = "index.handler"
  runtime       = "nodejs24.x"
  timeout       = var.timeout_seconds
  memory_size   = 256

  filename         = local.lambda_zip_path
  source_code_hash = filebase64sha256(local.lambda_zip_path)

  environment {
    variables = {
      KAFKA_BOOTSTRAP_BROKERS      = var.bootstrap_brokers
      KAFKA_NUM_PARTITIONS         = tostring(var.num_partitions)
      KAFKA_REPLICATION_FACTOR     = tostring(var.replication_factor)
      KAFKA_MIN_INSYNC_REPLICAS    = tostring(var.min_insync_replicas)
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
    terraform_data.build_lambda,
  ]
}

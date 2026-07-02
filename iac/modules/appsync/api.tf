resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/appsync/${local.api_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.api_name}-logs"
  })
}

resource "aws_appsync_graphql_api" "main" {
  name                = local.api_name
  authentication_type = "AMAZON_COGNITO_USER_POOLS"
  schema              = file("${path.module}/schema.graphql")
  xray_enabled        = var.xray_enabled

  user_pool_config {
    aws_region     = var.aws_region
    default_action = "ALLOW"
    user_pool_id   = var.cognito_user_pool_id
  }

  dynamic "additional_authentication_provider" {
    for_each = var.create_api_key ? [1] : []

    content {
      authentication_type = "API_KEY"
    }
  }

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.logging.arn
    field_log_level          = "ERROR"
  }

  tags = merge(local.common_tags, {
    Name = local.api_name
  })
}

resource "aws_appsync_api_key" "main" {
  count = var.create_api_key ? 1 : 0

  api_id  = aws_appsync_graphql_api.main.id
  expires = timeadd(timestamp(), "${var.api_key_ttl_hours}h")
}

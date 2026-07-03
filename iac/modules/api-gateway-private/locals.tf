locals {
  name_prefix = "${var.project_name}-${var.environment}"

  api_name = coalesce(var.api_name, "${local.name_prefix}-admin-http-api")

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "api-gateway-admin"
    }
  )

  api_endpoint = var.disable_execute_api_endpoint ? null : "https://${aws_apigatewayv2_api.private.id}.execute-api.${data.aws_region.current.region}.amazonaws.com"
}

data "aws_region" "current" {}

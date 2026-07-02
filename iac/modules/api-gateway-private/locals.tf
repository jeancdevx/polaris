locals {
  name_prefix = "${var.project_name}-${var.environment}"

  api_name = coalesce(var.api_name, "${local.name_prefix}-private-http-api")

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "api-gateway-private"
    }
  )

  private_invoke_host = "${aws_apigatewayv2_api.private.id}-${var.execute_api_vpc_endpoint_id}.execute-api.${data.aws_region.current.region}.amazonaws.com"

  private_api_endpoint = "https://${local.private_invoke_host}"
}

data "aws_region" "current" {}

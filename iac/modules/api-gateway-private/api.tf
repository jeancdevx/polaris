resource "aws_apigatewayv2_api" "private" {
  name          = local.api_name
  protocol_type = "HTTP"
  description   = "Admin HTTP API for Polaris (admin + internal routes; separate from the public mobile API)"

  disable_execute_api_endpoint = var.disable_execute_api_endpoint

  dynamic "cors_configuration" {
    for_each = length(var.cors_allow_origins) > 0 ? [1] : []

    content {
      allow_origins = var.cors_allow_origins
      allow_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      allow_headers = ["Authorization", "Content-Type", "X-User-Id"]
      max_age       = 300
    }
  }

  tags = merge(local.common_tags, {
    Name = local.api_name
  })
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.private.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    detailed_metrics_enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.api_name}-default"
  })
}

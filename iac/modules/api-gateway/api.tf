resource "aws_apigatewayv2_api" "public" {
  name          = local.api_name
  protocol_type = "HTTP"
  description   = "Public HTTP API for Polaris api-service (Fase 3.6)"

  tags = merge(local.common_tags, {
    Name = local.api_name
  })
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.public.id
  name        = "$default"
  auto_deploy = true

  tags = merge(local.common_tags, {
    Name = "${local.api_name}-default"
  })
}

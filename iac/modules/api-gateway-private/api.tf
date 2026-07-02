resource "aws_apigatewayv2_api" "private" {
  name          = local.api_name
  protocol_type = "HTTP"
  description   = "Private HTTP API for Polaris admin and internal routes (VPC endpoint only)"

  disable_execute_api_endpoint = true

  tags = merge(local.common_tags, {
    Name = local.api_name
  })
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.private.id
  name        = "$default"
  auto_deploy = true

  tags = merge(local.common_tags, {
    Name = "${local.api_name}-default"
  })
}

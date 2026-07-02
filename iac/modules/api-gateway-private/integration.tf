resource "aws_apigatewayv2_integration" "alb" {
  api_id             = aws_apigatewayv2_api.private.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = var.alb_listener_arn
  connection_type    = "VPC_LINK"
  connection_id      = var.vpc_link_id

  payload_format_version = "1.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_integration" "alb" {
  api_id             = aws_apigatewayv2_api.public.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = var.alb_listener_arn
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.alb.id

  payload_format_version = "1.0"
  timeout_milliseconds   = 30000
}

resource "aws_apigatewayv2_integration" "alb_authenticated" {
  api_id             = aws_apigatewayv2_api.public.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = var.alb_listener_arn
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.alb.id

  payload_format_version = "1.0"
  timeout_milliseconds   = 30000

  request_parameters = {
    "append:header.x-user-id" = "$context.authorizer.jwt.claims.preferred_username"
  }
}

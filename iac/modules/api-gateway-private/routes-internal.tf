resource "aws_apigatewayv2_route" "internal_proxy" {
  api_id    = aws_apigatewayv2_api.private.id
  route_key = "ANY /internal/{proxy+}"

  target = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

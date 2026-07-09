resource "aws_apigatewayv2_route" "admin_proxy" {
  for_each = toset(local.admin_http_methods)

  api_id    = aws_apigatewayv2_api.private.id
  route_key = "${each.value} /admin/{proxy+}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id

  target = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

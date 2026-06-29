resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.public.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

resource "aws_apigatewayv2_route" "auth_signin" {
  api_id    = aws_apigatewayv2_api.public.id
  route_key = "POST /auth/signin"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

resource "aws_apigatewayv2_route" "auth_refresh" {
  api_id    = aws_apigatewayv2_api.public.id
  route_key = "POST /auth/refresh"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

resource "aws_apigatewayv2_route" "auth_logout" {
  api_id    = aws_apigatewayv2_api.public.id
  route_key = "POST /auth/logout"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

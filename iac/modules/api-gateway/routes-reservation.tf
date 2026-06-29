resource "aws_apigatewayv2_route" "parking_reserve_post" {
  api_id    = aws_apigatewayv2_api.public.id
  route_key = "POST /parking/reserve"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id

  target = "integrations/${aws_apigatewayv2_integration.alb_authenticated.id}"
}

resource "aws_apigatewayv2_route" "parking_reserve_delete" {
  api_id    = aws_apigatewayv2_api.public.id
  route_key = "DELETE /parking/reserve/{id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id

  target = "integrations/${aws_apigatewayv2_integration.alb_authenticated.id}"
}

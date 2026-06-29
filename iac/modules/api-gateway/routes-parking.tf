resource "aws_apigatewayv2_route" "parking_availability" {
  api_id    = aws_apigatewayv2_api.public.id
  route_key = "GET /parking/availability"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

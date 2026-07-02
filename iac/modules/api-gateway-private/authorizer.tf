resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.private.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${local.name_prefix}-cognito-jwt"

  jwt_configuration {
    audience = [var.cognito_app_client_id]
    issuer   = var.cognito_issuer_url
  }
}

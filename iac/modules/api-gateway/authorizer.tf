# Authorizer Cognito
resource "aws_api_gateway_authorizer" "cognito" {
  count = var.cognito_user_pool_arn != "" ? 1 : 0

  name            = "${local.name}-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.public.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [var.cognito_user_pool_arn]
  identity_source = "method.request.header.Authorization"
}

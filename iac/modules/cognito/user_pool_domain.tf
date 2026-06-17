resource "aws_cognito_user_pool_domain" "main" {
  domain       = local.name
  user_pool_id = aws_cognito_user_pool.main.id
}

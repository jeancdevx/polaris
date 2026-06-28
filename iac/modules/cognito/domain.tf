resource "aws_cognito_user_pool_domain" "main" {
  count = var.create_user_pool_domain ? 1 : 0

  domain       = local.user_pool_domain
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_pool_domain" "auth" {
  count = var.cognito_user_pool_id != "" ? 1 : 0

  domain          = local.auth_fqdn
  user_pool_id    = var.cognito_user_pool_id
  certificate_arn = aws_acm_certificate_validation.cloudfront.certificate_arn
}

output "app_client_id" {
  description = "Cognito app client ID for mobile and web applications"
  value       = aws_cognito_user_pool_client.app.id
}

output "hosted_ui_domain" {
  description = "Cognito hosted UI domain prefix when enabled"
  value       = var.create_user_pool_domain ? aws_cognito_user_pool_domain.main[0].domain : null
}

output "hosted_ui_url" {
  description = "Cognito hosted UI base URL when domain is enabled"
  value = var.create_user_pool_domain ? format(
    "https://%s.auth.%s.amazoncognito.com",
    aws_cognito_user_pool_domain.main[0].domain,
    data.aws_region.current.region
  ) : null
}

output "issuer_url" {
  description = "OpenID Connect issuer URL for JWT validation"
  value       = local.issuer_url
}

output "jwks_uri" {
  description = "JWKS URI for JWT signature verification"
  value       = "${local.issuer_url}/.well-known/jwks.json"
}

output "user_group_names" {
  description = "Cognito user group names created by the module"
  value = {
    admin = aws_cognito_user_group.admin.name
    user  = aws_cognito_user_group.user.name
  }
}

output "user_pool_arn" {
  description = "ARN of the Cognito user pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Endpoint name of the Cognito user pool"
  value       = aws_cognito_user_pool.main.endpoint
}

output "user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = aws_cognito_user_pool.main.id
}

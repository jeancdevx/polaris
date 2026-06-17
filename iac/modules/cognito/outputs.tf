output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.endpoint
}

output "mobile_app_client_id" {
  description = "ID of the mobile app client"
  value       = aws_cognito_user_pool_client.mobile_app.id
}

output "mobile_app_client_secret" {
  description = "Secret of the mobile app client"
  value       = aws_cognito_user_pool_client.mobile_app.client_secret
  sensitive   = true
}

output "web_admin_client_id" {
  description = "ID of the web admin client"
  value       = aws_cognito_user_pool_client.web_admin.id
}

output "web_admin_client_secret" {
  description = "Secret of the web admin client"
  value       = aws_cognito_user_pool_client.web_admin.client_secret
  sensitive   = true
}

output "domain" {
  description = "Domain of the Cognito User Pool"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "hosted_ui_url" {
  description = "Hosted UI URL for the Cognito User Pool"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.region}.amazoncognito.com"
}

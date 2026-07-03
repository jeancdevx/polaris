output "api_public_url" {
  description = "Public API URL via CloudFront (only supported entry point)"
  value       = "https://${local.api_fqdn}"
}

output "admin_public_url" {
  description = "Web-admin URL via CloudFront"
  value       = "https://${local.admin_fqdn}"
}

output "atlantis_public_url" {
  description = "Atlantis URL via CloudFront when enabled"
  value       = var.atlantis_alb_dns_name != "" ? "https://${local.atlantis_fqdn}" : null
}

output "api_fqdn" {
  description = "FQDN for the public API"
  value       = local.api_fqdn
}

output "admin_fqdn" {
  description = "FQDN for web-admin"
  value       = local.admin_fqdn
}

output "atlantis_fqdn" {
  description = "FQDN for Atlantis"
  value       = local.atlantis_fqdn
}

output "api_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the public API"
  value       = aws_cloudfront_distribution.api.id
}

output "web_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for web-admin"
  value       = aws_cloudfront_distribution.web.id
}

output "origin_verify_secret_arn" {
  description = "Secrets Manager ARN with CloudFront origin verify header name/value"
  value       = aws_secretsmanager_secret.origin_verify.arn
  sensitive   = true
}

output "origin_verify_header_name" {
  description = "Header name CloudFront sends to API Gateway"
  value       = var.origin_verify_header_name
}

output "api_regional_waf_arn" {
  description = "Regional WAF ACL ARN protecting API Gateway"
  value       = aws_wafv2_web_acl.api_regional.arn
}

output "cloudfront_waf_arn" {
  description = "CloudFront WAF ACL ARN (us-east-1)"
  value       = aws_wafv2_web_acl.cloudfront.arn
}

output "api_gateway_regional_domain" {
  description = "Regional API Gateway domain target (direct access blocked by WAF)"
  value       = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
}

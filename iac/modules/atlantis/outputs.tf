output "alb_dns_name" {
  description = "DNS name of the Atlantis load balancer (CNAME target)"
  value       = aws_lb.atlantis.dns_name
}

output "atlantis_url" {
  description = "Public HTTPS URL for Atlantis and the GitHub webhook"
  value       = local.atlantis_url
}

output "log_group_name" {
  description = "CloudWatch log group for Atlantis"
  value       = aws_cloudwatch_log_group.atlantis.name
}

output "secret_arn" {
  description = "Secrets Manager ARN with github_token and webhook_secret"
  value       = aws_secretsmanager_secret.atlantis.arn
  sensitive   = true
}

output "webhook_secret" {
  description = "GitHub webhook secret (configure in repo webhook settings)"
  value       = local.webhook_secret
  sensitive   = true
}

output "webhook_url" {
  description = "GitHub webhook payload URL"
  value       = "${local.atlantis_url}/events"
}

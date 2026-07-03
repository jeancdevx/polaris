output "deploy_role_arn" {
  description = "IAM role ARN GitHub Actions assumes for deployments (AWS_DEPLOY_ROLE_ARN secret)"
  value       = aws_iam_role.github_deploy.arn
}

output "deploy_role_name" {
  description = "IAM role name GitHub Actions assumes for deployments"
  value       = aws_iam_role.github_deploy.name
}

output "oidc_provider_arn" {
  description = "GitHub Actions OIDC provider ARN"
  value       = local.oidc_provider_arn
}

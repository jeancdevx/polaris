output "terraform_apply_role_arn" {
  description = "IAM role ARN for GitHub Actions terraform apply (AWS_TERRAFORM_APPLY_ROLE_ARN)"
  value       = aws_iam_role.terraform_apply.arn
}

output "terraform_apply_role_name" {
  description = "IAM role name for GitHub Actions terraform apply"
  value       = aws_iam_role.terraform_apply.name
}

output "oidc_provider_arn" {
  description = "GitHub Actions OIDC provider ARN"
  value       = local.oidc_provider_arn
}

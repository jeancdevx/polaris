data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  name_prefix        = "${var.project_name}-${var.environment}"
  account_id         = data.aws_caller_identity.current.account_id
  region             = data.aws_region.current.region
  github_environment = var.github_environment != "" ? var.github_environment : var.environment

  oidc_hostname = "token.actions.githubusercontent.com"
  oidc_provider_arn = (
    var.create_oidc_provider
    ? aws_iam_openid_connect_provider.github[0].arn
    : "arn:aws:iam::${local.account_id}:oidc-provider/${local.oidc_hostname}"
  )

  allowed_subject = "repo:${var.github_repository}:environment:${local.github_environment}"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  )
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  mfa_configuration = coalesce(
    var.mfa_configuration,
    var.environment == "dev" ? "OFF" : "OPTIONAL"
  )

  mfa_enabled = local.mfa_configuration != "OFF"

  deletion_protection = coalesce(
    var.deletion_protection,
    var.environment == "prod"
  )

  user_pool_domain = coalesce(
    var.domain_prefix,
    "${var.project_name}-${var.environment}-auth"
  )

  issuer_url = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/${aws_cognito_user_pool.main.id}"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "cognito"
    }
  )
}

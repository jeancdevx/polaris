locals {
  state_bucket_name = coalesce(
    var.state_bucket_name_override,
    "${var.project_name}-${var.environment}-tfstate-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
  )

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "bootstrap"
    }
  )
}

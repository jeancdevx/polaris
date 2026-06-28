locals {
  name_prefix = "${var.project_name}-${var.environment}"

  account_id = data.aws_caller_identity.current.account_id

  bucket_name_suffix = "${var.environment}-${local.account_id}"

  force_destroy = coalesce(
    var.force_destroy,
    var.environment == "dev"
  )

  lifecycle_glacier_transition_days = coalesce(
    var.lifecycle_glacier_transition_days,
    90
  )

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "s3"
    }
  )
}

locals {
  name_segment = var.environment == "prod" ? "" : "${var.environment}-"

  admin_web_origin = "https://${local.name_segment}admin.${var.base_domain}"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  )
}

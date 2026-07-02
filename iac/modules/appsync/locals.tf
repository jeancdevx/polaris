locals {
  name_prefix = "${var.project_name}-${var.environment}"

  api_name = coalesce(var.api_name, "${local.name_prefix}-graphql-api")

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "appsync"
    }
  )
}

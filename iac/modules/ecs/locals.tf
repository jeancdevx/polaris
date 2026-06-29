locals {
  name_prefix = "${var.project_name}-${var.environment}"

  api_service_name = coalesce(var.api_service_name, "${local.name_prefix}-api-service")

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "ecs"
    }
  )
}

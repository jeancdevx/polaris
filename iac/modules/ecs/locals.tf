locals {
  name_prefix = "${var.project_name}-${var.environment}"

  api_service_name = coalesce(var.api_service_name, "${local.name_prefix}-api-service")

  reservation_service_name = coalesce(
    var.reservation_service_name,
    "${local.name_prefix}-reservation-service"
  )

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

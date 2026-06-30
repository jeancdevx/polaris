locals {
  name_prefix = "${var.project_name}-${var.environment}"

  powertools_service_name = coalesce(var.powertools_service_name, var.function_name)

  use_vpc = length(var.subnet_ids) > 0 && length(var.security_group_ids) > 0

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "lambda"
    }
  )
}

locals {
  name = "${var.project_name}-${var.environment}"

  common_tags = merge(
    var.additional_tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "database"
    }
  )

  parameter_group_family = "aurora-postgresql${split(".", var.engine_version)[0]}"
}

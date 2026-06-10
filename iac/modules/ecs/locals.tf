locals {
  name = "${var.project_name}-${var.environment}"

  common_tags = merge(
    var.additional_tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "ecs"
    }
  )

  cluster_name = var.cluster_name != "" ? var.cluster_name : local.name

  az_count = length(var.private_subnet_ids)
}

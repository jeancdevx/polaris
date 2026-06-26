locals {
  name_prefix = "${var.project_name}-${var.environment}"

  alb_ingress_cidr_blocks = coalesce(var.alb_ingress_cidr_blocks, [var.vpc_cidr_block])

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "security-groups"
    }
  )
}

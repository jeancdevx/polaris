locals {
  name = "${var.project_name}-${var.environment}"

  common_tags = merge(
    var.additional_tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "messaging"
    }
  )
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

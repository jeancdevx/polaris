data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

resource "random_password" "webhook_secret" {
  count = var.webhook_secret == "" ? 1 : 0

  length  = 32
  special = false
}

locals {
  name_prefix    = "${var.project_name}-${var.environment}"
  region         = data.aws_region.current.region
  atlantis_url   = "https://${var.domain_name}"
  webhook_secret = var.webhook_secret != "" ? var.webhook_secret : random_password.webhook_secret[0].result
  container_name = "atlantis"

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  )
}

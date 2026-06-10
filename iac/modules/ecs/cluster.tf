resource "aws_ecs_cluster" "main" {
  count = var.enable_cluster ? 1 : 0

  name = local.cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

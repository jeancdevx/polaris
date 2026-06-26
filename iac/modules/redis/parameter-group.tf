resource "aws_elasticache_parameter_group" "cluster" {
  count = local.use_serverless ? 0 : 1

  name        = "${local.name_prefix}-redis7-cluster"
  family      = "redis7"
  description = "Redis 7 cluster mode for Polaris"

  parameter {
    name  = "cluster-enabled"
    value = "yes"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis7-cluster"
  })

  lifecycle {
    create_before_destroy = true
  }
}

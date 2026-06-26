resource "aws_elasticache_subnet_group" "main" {
  count = local.use_serverless ? 0 : 1

  name       = "${local.name_prefix}-redis-subnet"
  subnet_ids = var.subnet_ids

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-subnet-group"
  })

  lifecycle {
    create_before_destroy = true
  }
}

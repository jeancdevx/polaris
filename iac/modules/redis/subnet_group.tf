resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name}-redis-subnet-group"
  subnet_ids = var.data_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${local.name}-redis-subnet-group"
  })
}

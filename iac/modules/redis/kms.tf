resource "aws_kms_key" "redis" {
  count = var.at_rest_encryption_enabled ? 1 : 0

  description             = "KMS key for ElastiCache ${local.name} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "${local.name}-redis-kms"
    Service = "elasticache"
  })
}

resource "aws_kms_alias" "redis" {
  count = var.at_rest_encryption_enabled ? 1 : 0

  name          = "alias/${local.name}-redis"
  target_key_id = aws_kms_key.redis[0].key_id
}

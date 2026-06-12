resource "aws_elasticache_serverless_cache" "main" {
  name        = local.name
  engine      = "redis"
  description = "Serverless Redis cache for ${local.name}"

  major_engine_version = split(".", var.engine_version)[0]

  kms_key_id = aws_kms_key.redis[0].arn

  subnet_ids         = var.data_subnet_ids
  security_group_ids = [aws_security_group.redis[0].id]

  snapshot_retention_limit = var.snapshot_retention_limit
  daily_snapshot_time      = var.daily_snapshot_time

  cache_usage_limits {
    data_storage {
      maximum = var.max_data_storage_gb
      unit    = "GB"
    }
    ecpu_per_second {
      maximum = var.max_ecpu_per_second
    }
  }

  tags = merge(local.common_tags, {
    Name = local.name
  })
}

resource "aws_elasticache_serverless_cache" "main" {
  count = local.use_serverless ? 1 : 0

  engine = "redis"
  name   = "${local.name_prefix}-redis"

  major_engine_version = var.major_engine_version

  cache_usage_limits {
    data_storage {
      maximum = local.serverless_max_data_storage_gb
      unit    = "GB"
    }

    ecpu_per_second {
      maximum = local.serverless_max_ecpu_per_second
    }
  }

  subnet_ids         = var.subnet_ids
  security_group_ids = var.security_group_ids

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-serverless"
  })
}

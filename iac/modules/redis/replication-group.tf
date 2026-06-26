resource "random_password" "auth_token" {
  count = local.use_serverless || !local.transit_encryption_enabled || var.auth_token != null ? 0 : 1

  length  = 32
  special = false
}

resource "aws_elasticache_replication_group" "main" {
  count = local.use_serverless ? 0 : 1

  replication_group_id = "${local.name_prefix}-redis"
  description          = "Polaris Redis cluster mode"

  engine         = "redis"
  engine_version = var.engine_version
  node_type      = local.node_type
  port           = var.port

  parameter_group_name = aws_elasticache_parameter_group.cluster[0].name
  subnet_group_name    = aws_elasticache_subnet_group.main[0].name
  security_group_ids   = var.security_group_ids

  num_node_groups         = local.num_shards
  replicas_per_node_group = local.replicas_per_shard

  automatic_failover_enabled = local.replicas_per_shard > 0
  multi_az_enabled           = local.replicas_per_shard > 0

  at_rest_encryption_enabled = true
  transit_encryption_enabled = local.transit_encryption_enabled
  auth_token                 = local.transit_encryption_enabled ? local.auth_token : null

  apply_immediately = var.environment == "dev"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-cluster"
  })
}

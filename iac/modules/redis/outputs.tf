output "auth_token" {
  description = "Redis AUTH token for provisioned caches with transit encryption"
  value       = local.auth_token
  sensitive   = true
}

output "capacity_mode" {
  description = "Active Redis capacity mode (serverless or provisioned)"
  value       = local.capacity_mode
}

output "cache_cluster_ids" {
  description = "Provisioned Redis cache cluster IDs used for node-level CloudWatch metrics"
  value       = local.use_serverless ? [] : aws_elasticache_replication_group.main[0].member_clusters
}

output "cache_name" {
  description = "Serverless Redis cache name used for CloudWatch metrics"
  value       = local.use_serverless ? aws_elasticache_serverless_cache.main[0].name : null
}

output "configuration_endpoint" {
  description = "Redis configuration endpoint for cluster mode or serverless primary endpoint"
  value       = local.use_serverless ? aws_elasticache_serverless_cache.main[0].endpoint[0].address : aws_elasticache_replication_group.main[0].configuration_endpoint_address
}

output "num_shards" {
  description = "Number of shards in provisioned cluster mode"
  value       = local.use_serverless ? 0 : local.num_shards
}

output "serverless_max_data_storage_gb" {
  description = "Configured serverless data storage capacity in GB"
  value       = local.use_serverless ? local.serverless_max_data_storage_gb : 0
}

output "port" {
  description = "Redis port"
  value       = local.use_serverless ? aws_elasticache_serverless_cache.main[0].endpoint[0].port : aws_elasticache_replication_group.main[0].port
}

output "primary_endpoint" {
  description = "Redis primary endpoint address"
  value       = local.use_serverless ? aws_elasticache_serverless_cache.main[0].endpoint[0].address : aws_elasticache_replication_group.main[0].primary_endpoint_address
}

output "reader_endpoint" {
  description = "Redis reader endpoint address"
  value       = local.use_serverless ? try(aws_elasticache_serverless_cache.main[0].reader_endpoint[0].address, null) : aws_elasticache_replication_group.main[0].reader_endpoint_address
}

output "redis_arn" {
  description = "ARN of the Redis cache"
  value       = local.use_serverless ? aws_elasticache_serverless_cache.main[0].arn : aws_elasticache_replication_group.main[0].arn
}

output "redis_url" {
  description = "Redis connection URL for application clients inside the VPC"
  value = local.use_serverless ? format(
    "rediss://%s:%s",
    aws_elasticache_serverless_cache.main[0].endpoint[0].address,
    aws_elasticache_serverless_cache.main[0].endpoint[0].port
    ) : (
    local.transit_encryption_enabled ? format(
      "rediss://:%s@%s:%s",
      local.auth_token,
      aws_elasticache_replication_group.main[0].configuration_endpoint_address,
      aws_elasticache_replication_group.main[0].port
      ) : format(
      "redis://%s:%s",
      aws_elasticache_replication_group.main[0].configuration_endpoint_address,
      aws_elasticache_replication_group.main[0].port
    )
  )
  sensitive = true
}

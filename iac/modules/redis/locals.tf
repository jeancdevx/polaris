locals {
  name_prefix = "${var.project_name}-${var.environment}"

  capacity_mode = coalesce(
    var.capacity_mode,
    var.environment == "dev" ? "serverless" : "provisioned"
  )

  use_serverless = local.capacity_mode == "serverless"

  num_shards = coalesce(
    var.num_shards,
    local.use_serverless ? 0 : var.environment == "prod" ? 3 : 2
  )

  replicas_per_shard = coalesce(
    var.replicas_per_shard,
    local.use_serverless ? 0 : 1
  )

  node_type = coalesce(
    var.node_type,
    var.environment == "prod" ? "cache.r7g.large" : "cache.t4g.medium"
  )

  serverless_max_data_storage_gb = coalesce(
    var.serverless_max_data_storage_gb,
    var.environment == "dev" ? 10 : 20
  )

  serverless_max_ecpu_per_second = coalesce(
    var.serverless_max_ecpu_per_second,
    5000
  )

  transit_encryption_enabled = coalesce(
    var.transit_encryption_enabled,
    !local.use_serverless
  )

  auth_token = local.use_serverless ? null : coalesce(
    var.auth_token,
    try(random_password.auth_token[0].result, null)
  )

  common_tags = merge(
    var.tags,
    {
      Project      = var.project_name
      Environment  = var.environment
      ManagedBy    = "terraform"
      Component    = "redis"
      CapacityMode = local.capacity_mode
    }
  )
}

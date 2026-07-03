module "redis" {
  source = "../../modules/redis"

  project_name = var.project_name
  environment  = var.environment

  capacity_mode                  = var.redis_capacity_mode
  major_engine_version           = var.redis_major_engine_version
  engine_version                 = var.redis_engine_version
  serverless_max_data_storage_gb = var.redis_serverless_max_data_storage_gb
  serverless_max_ecpu_per_second = var.redis_serverless_max_ecpu_per_second
  num_shards                     = var.redis_num_shards
  replicas_per_shard             = var.redis_replicas_per_shard
  node_type                      = var.redis_node_type
  transit_encryption_enabled     = var.redis_transit_encryption_enabled

  subnet_ids         = module.vpc.data_subnet_ids
  security_group_ids = [module.security_groups.redis_security_group_id]

  tags = var.tags
}

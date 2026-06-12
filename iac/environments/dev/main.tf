module "vpc" {
  source = "../../modules/vpc"

  environment  = var.environment
  project_name = var.project_name

  vpc_cidr = var.vpc_cidr
  azs      = var.azs

  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  data_subnet_cidrs    = var.data_subnet_cidrs

  enable_nat_gateway    = var.enable_nat_gateway
  single_nat_gateway    = var.single_nat_gateway
  enable_vpc_endpoints  = var.enable_vpc_endpoints
  vpc_endpoint_services = var.vpc_endpoint_services

  additional_tags = local.default_tags
}

module "ecs" {
  source = "../../modules/ecs"

  environment  = var.environment
  project_name = var.project_name

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  cluster_name = "${var.project_name}-${var.environment}"

  services = {}

  additional_tags = local.default_tags
}

module "rds" {
  source = "../../modules/rds"

  environment  = var.environment
  project_name = var.project_name

  vpc_id          = module.vpc.vpc_id
  data_subnet_ids = module.vpc.data_subnet_ids

  db_name     = "parking_db"
  db_username = "parking_admin"
  db_password = var.db_password

  engine_version   = var.db_engine_version
  scalability_type = var.db_scalability_type

  serverless_min_acu         = var.db_serverless_min_acu
  serverless_max_acu         = var.db_serverless_max_acu
  provisioned_instance_class = var.db_provisioned_instance_class

  writer_count = var.db_writer_count
  reader_count = var.db_reader_count

  storage_type = var.db_storage_type

  multi_az                    = var.db_multi_az
  backup_retention_period     = var.db_backup_retention_period
  deletion_protection         = var.db_deletion_protection
  skip_final_snapshot         = var.db_skip_final_snapshot
  enable_performance_insights = var.db_enable_performance_insights

  allowed_security_group_ids = [module.ecs.security_group_ids.services]

  additional_tags = local.default_tags
}

module "redis" {
  source = "../../modules/redis"

  environment  = var.environment
  project_name = var.project_name

  vpc_id          = module.vpc.vpc_id
  data_subnet_ids = module.vpc.data_subnet_ids

  engine_version = var.redis_engine_version

  max_data_storage_gb = var.redis_max_data_storage_gb
  max_ecpu_per_second = var.redis_max_ecpu_per_second

  transit_encryption_enabled = var.redis_transit_encryption_enabled
  at_rest_encryption_enabled = var.redis_at_rest_encryption_enabled

  snapshot_retention_limit = var.redis_snapshot_retention_limit
  daily_snapshot_time      = var.redis_daily_snapshot_time

  allowed_security_group_ids = [module.ecs.security_group_ids.services]

  additional_tags = local.default_tags
}

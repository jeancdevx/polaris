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

  # API Gateway VPC Endpoint
  create_api_gateway_endpoint            = true
  api_gateway_endpoint_security_group_id = module.security_groups.api_gateway_vpc_endpoint_security_group_id

  additional_tags = local.default_tags
}

module "iam" {
  source = "../../modules/iam"

  environment        = var.environment
  project_name       = var.project_name
  kafka_cluster_arn  = module.kafka.cluster_arn
  kafka_cluster_name = module.kafka.cluster_name

  lambda_functions = local.lambda_iam_functions

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

module "api_gateway" {
  source = "../../modules/api-gateway"

  environment  = var.environment
  project_name = var.project_name

  vpc_id             = module.vpc.vpc_id
  vpc_cidr           = module.vpc.vpc_cidr
  private_subnet_ids = module.vpc.private_subnet_ids

  alb_arn      = module.ecs.alb_arn
  alb_dns_name = module.ecs.alb_dns_name

  cognito_user_pool_arn = module.cognito.user_pool_arn

  throttling_burst_limit = 100
  throttling_rate_limit  = 50

  # Security groups from security_groups module
  vpc_link_security_group_id = module.security_groups.api_gateway_vpc_link_security_group_id

  # VPC Endpoint from vpc module
  vpc_endpoint_id = module.vpc.execute_api_endpoint_id

  additional_tags = local.default_tags
}

module "kafka_ui" {
  source = "../../modules/kafka-ui"

  environment  = var.environment
  project_name = var.project_name

  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids

  ecs_cluster_id          = module.ecs.cluster_id
  task_execution_role_arn = module.ecs.task_execution_role_arn
  task_role_arn           = module.iam.kafka_ui_task_role_arn

  kafka_bootstrap_servers = module.kafka.bootstrap_brokers_sasl_iam
  kafka_cluster_name      = module.kafka.cluster_name

  additional_tags = local.default_tags
}

module "security_groups" {
  source = "../../modules/security-groups"

  environment  = var.environment
  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = module.vpc.vpc_cidr

  kafka_ui_security_group_id = module.kafka_ui.security_group_id

  lambda_functions = local.lambda_sg_functions

  additional_tags = local.default_tags
}

module "cognito" {
  source = "../../modules/cognito"

  environment  = var.environment
  project_name = var.project_name

  # Password policy
  password_minimum_length    = 8
  password_require_lowercase = true
  password_require_uppercase = true
  password_require_numbers   = true
  password_require_symbols   = false

  # MFA configuration
  mfa_configuration = "OFF"

  # Auto-verified attributes
  auto_verified_attributes = ["email"]

  # Token validity
  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

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

module "kafka" {
  source = "../../modules/kafka"

  environment  = var.environment
  project_name = var.project_name

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  kafka_version          = var.kafka_version
  number_of_broker_nodes = var.kafka_number_of_broker_nodes
  broker_instance_type   = var.kafka_broker_instance_type
  broker_ebs_volume_size = var.kafka_broker_ebs_volume_size

  encryption_in_transit_client_broker = var.kafka_encryption_in_transit_client_broker
  encryption_in_transit_inter_broker  = var.kafka_encryption_in_transit_inter_broker

  enable_cloudwatch_logs = var.kafka_enable_cloudwatch_logs
  enhanced_monitoring    = var.kafka_enhanced_monitoring

  security_group_id = module.security_groups.msk_security_group_id

  additional_tags = local.default_tags
}

module "lambda" {
  source = "../../modules/lambda"

  environment  = var.environment
  project_name = var.project_name

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  functions = local.lambda_functions

  role_arns          = module.iam.lambda_role_arns
  security_group_ids = module.security_groups.lambda_security_group_ids

  additional_tags = local.default_tags
}

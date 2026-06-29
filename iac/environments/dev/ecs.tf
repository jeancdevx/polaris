module "ecs" {
  source = "../../modules/ecs"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids

  alb_security_group_id = module.security_groups.alb_security_group_id
  ecs_security_group_id = module.security_groups.ecs_security_group_id

  ecs_task_execution_role_arn           = module.iam.ecs_task_execution_role_arn
  ecs_api_service_task_role_arn         = module.iam.ecs_api_service_task_role_arn
  ecs_reservation_service_task_role_arn = module.iam.ecs_reservation_service_task_role_arn

  ecr_repository_url                     = module.ecr.repository_url
  api_service_image_tag                  = var.api_service_image_tag
  api_service_desired_count              = var.api_service_desired_count
  api_service_cpu                        = var.api_service_cpu
  api_service_memory                     = var.api_service_memory
  reservation_service_ecr_repository_url = module.ecr_reservation_service.repository_url
  reservation_service_image_tag          = var.reservation_service_image_tag
  reservation_service_desired_count      = var.reservation_service_desired_count
  reservation_service_cpu                = var.reservation_service_cpu
  reservation_service_memory             = var.reservation_service_memory
  enable_deletion_protection             = var.ecs_enable_deletion_protection

  rds_master_user_secret_arn       = module.rds.master_user_secret_arn
  rds_cluster_endpoint             = module.rds.cluster_endpoint
  rds_cluster_port                 = module.rds.cluster_port
  rds_database_name                = module.rds.database_name
  redis_url                        = module.redis.redis_url
  kafka_bootstrap_brokers_sasl_iam = module.kafka.bootstrap_brokers_sasl_iam

  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_app_client_id = module.cognito.app_client_id
  cognito_issuer_url    = module.cognito.issuer_url

  alb_logs_bucket_name = module.s3.alb_logs_bucket_name
  alb_logs_prefix      = var.alb_logs_prefix

  tags = var.tags
}

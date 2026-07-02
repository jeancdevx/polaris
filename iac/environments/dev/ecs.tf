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
  ecs_admin_service_task_role_arn       = module.iam.ecs_admin_service_task_role_arn
  ecs_reservation_service_task_role_arn = module.iam.ecs_reservation_service_task_role_arn
  ecs_event_processor_task_role_arn     = module.iam.ecs_event_processor_task_role_arn

  ecr_repository_url                         = module.ecr_api_service.repository_url
  api_service_image_tag                      = var.api_service_image_tag
  api_service_desired_count                  = var.api_service_desired_count
  api_service_cpu                            = var.api_service_cpu
  api_service_memory                         = var.api_service_memory
  admin_service_ecr_repository_url           = module.ecr_admin_service.repository_url
  admin_service_image_tag                    = var.admin_service_image_tag
  admin_service_desired_count                = var.admin_service_desired_count
  admin_service_cpu                          = var.admin_service_cpu
  admin_service_memory                       = var.admin_service_memory
  rfid_validations_table_name                = module.dynamodb.table_names.RFIDValidations
  reservation_service_ecr_repository_url     = module.ecr_reservation_service.repository_url
  reservation_service_image_tag              = var.reservation_service_image_tag
  reservation_service_desired_count          = var.reservation_service_desired_count
  reservation_service_cpu                    = var.reservation_service_cpu
  reservation_service_memory                 = var.reservation_service_memory
  event_processor_service_ecr_repository_url = module.ecr_event_processor_service.repository_url
  event_processor_service_image_tag          = var.event_processor_service_image_tag
  event_processor_service_desired_count      = var.event_processor_service_desired_count
  event_processor_service_cpu                = var.event_processor_service_cpu
  event_processor_service_memory             = var.event_processor_service_memory
  eventbridge_bus_name                       = module.eventbridge.bus_name
  enable_deletion_protection                 = var.ecs_enable_deletion_protection

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

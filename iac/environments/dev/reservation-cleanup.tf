module "reservation_cleanup" {
  source = "../../modules/reservation-cleanup"

  project_name = var.project_name
  environment  = var.environment

  lambda_role_arn       = module.iam.reservation_cleanup_role_arn
  bootstrap_brokers     = module.kafka.bootstrap_brokers_sasl_iam
  eventbridge_bus_name  = "polaris-events"
  rds_master_secret_arn = module.rds.master_user_secret_arn
  rds_cluster_endpoint  = module.rds.cluster_endpoint
  rds_database_name     = module.rds.database_name
  redis_url             = module.redis.redis_url

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  tags = var.tags

  depends_on = [
    module.iam,
    module.kafka_topic_creator,
  ]
}

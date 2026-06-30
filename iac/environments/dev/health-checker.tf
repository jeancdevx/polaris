module "health_checker" {
  source = "../../modules/health-checker"

  project_name = var.project_name
  environment  = var.environment

  lambda_role_arn       = module.iam.health_checker_role_arn
  sns_alerts_topic_arn  = module.sns.alerts_topic_arn
  rds_master_secret_arn = module.rds.master_user_secret_arn
  rds_cluster_endpoint  = module.rds.cluster_endpoint
  rds_database_name     = module.rds.database_name
  redis_url             = module.redis.redis_url

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  tags = var.tags

  depends_on = [
    module.iam,
    module.sns,
  ]
}

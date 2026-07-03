module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = var.environment

  msk_cluster_arn                          = module.kafka.cluster_arn
  enable_ecs_api_service_cognito_policy    = true
  enable_ecs_admin_service_cognito_policy  = true
  enable_ecs_admin_service_dynamodb_policy = true
  enable_ecs_db_bootstrap_cognito_policy   = true
  cognito_user_pool_arn                    = module.cognito.user_pool_arn

  tags = var.tags
}

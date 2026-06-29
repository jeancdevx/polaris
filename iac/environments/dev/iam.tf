module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = var.environment

  msk_cluster_arn       = module.kafka.cluster_arn
  cognito_user_pool_arn = module.cognito.user_pool_arn

  tags = var.tags
}

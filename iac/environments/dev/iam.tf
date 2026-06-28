module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = var.environment

  msk_cluster_arn = module.kafka.cluster_arn

  tags = var.tags
}

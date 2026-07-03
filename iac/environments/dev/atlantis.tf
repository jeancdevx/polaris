module "atlantis" {
  count = var.enable_atlantis ? 1 : 0

  source = "../../modules/atlantis"

  project_name = var.project_name
  environment  = var.environment

  cluster_arn         = module.ecs.cluster_arn
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  domain_name         = var.atlantis_domain_name
  acm_certificate_arn = var.atlantis_acm_certificate_arn

  github_repository = var.github_repository
  github_token      = var.atlantis_github_token
  webhook_secret    = var.atlantis_webhook_secret

  state_bucket_name = var.terraform_state_bucket
  state_key         = var.terraform_state_key

  tags = var.tags
}

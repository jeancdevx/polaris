module "github_terraform" {
  source = "../../modules/github-terraform"

  create_oidc_provider = false

  project_name      = var.project_name
  environment       = var.environment
  github_repository = var.github_repository

  state_bucket_name = var.terraform_state_bucket
  state_key_prefix  = "env/${var.environment}/"

  tags = var.tags
}

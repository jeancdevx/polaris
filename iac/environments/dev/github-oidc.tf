module "github_oidc" {
  source = "../../modules/github-oidc"

  project_name      = var.project_name
  environment       = var.environment
  github_repository = var.github_repository

  tags = var.tags
}

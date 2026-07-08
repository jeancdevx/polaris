module "github_oidc" {
  source = "../../modules/github-oidc"

  project_name      = var.project_name
  environment       = var.environment
  github_repository = var.github_repository

  assets_bucket_arn              = module.s3.assets_bucket_arn
  web_cloudfront_distribution_id = module.edge.web_cloudfront_distribution_id

  tags = var.tags

  depends_on = [module.edge]
}

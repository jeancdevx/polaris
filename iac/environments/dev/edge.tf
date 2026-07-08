module "edge" {
  source = "../../modules/edge"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  tags         = var.tags

  web_only = true

  assets_bucket_name              = module.s3.assets_bucket_name
  assets_bucket_https_policy_json = module.s3.assets_bucket_https_policy_json

  depends_on = [module.s3]
}

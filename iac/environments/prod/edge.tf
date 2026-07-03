module "edge" {
  source = "../../modules/edge"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  tags         = var.tags

  base_domain    = var.base_domain
  hosted_zone_id = var.hosted_zone_id

  api_gateway_id       = module.api_gateway.api_id
  admin_api_gateway_id = module.api_gateway_private.api_id

  appsync_api_id       = module.appsync.api_id
  cognito_user_pool_id = module.cognito.user_pool_id

  assets_bucket_name              = module.s3.assets_bucket_name
  assets_bucket_https_policy_json = module.s3.assets_bucket_https_policy_json

  atlantis_alb_dns_name = try(module.atlantis[0].alb_dns_name, "")

  enable_atlantis_cloudfront = var.enable_atlantis

  depends_on = [
    module.api_gateway,
    module.api_gateway_private,
    module.s3,
    module.appsync,
    module.cognito,
  ]
}

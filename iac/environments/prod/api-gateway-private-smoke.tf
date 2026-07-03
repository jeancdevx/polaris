module "api_gateway_private_smoke" {
  source = "../../modules/api-gateway-private-smoke"

  project_name = var.project_name
  environment  = var.environment

  lambda_role_arn      = module.iam.api_gateway_private_smoke_role_arn
  private_api_base_url = module.api_gateway_private.api_endpoint

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  tags = var.tags

  depends_on = [
    module.api_gateway_private,
    module.iam,
  ]
}

module "api_gateway_private" {
  source = "../../modules/api-gateway-private"

  project_name = var.project_name
  environment  = var.environment

  vpc_link_id      = module.api_gateway.vpc_link_id
  alb_listener_arn = module.ecs.alb_listener_arn

  cognito_app_client_id = module.cognito.app_client_id
  cognito_issuer_url    = module.cognito.issuer_url

  tags = var.tags

  depends_on = [
    module.api_gateway,
    module.ecs,
  ]
}

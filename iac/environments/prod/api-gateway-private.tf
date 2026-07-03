module "api_gateway_private" {
  source = "../../modules/api-gateway-private"

  project_name = var.project_name
  environment  = var.environment

  disable_execute_api_endpoint = true

  vpc_link_id      = module.api_gateway.vpc_link_id
  alb_listener_arn = module.ecs.alb_listener_arn

  cognito_app_client_id = module.cognito.app_client_id
  cognito_issuer_url    = module.cognito.issuer_url

  cors_allow_origins = [local.admin_web_origin]

  tags = var.tags

  depends_on = [
    module.api_gateway,
    module.ecs,
  ]
}

module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name = var.project_name
  environment  = var.environment

  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  vpc_link_security_group_id = module.security_groups.vpc_link_security_group_id

  alb_listener_arn = module.ecs.alb_listener_arn

  tags = var.tags
}

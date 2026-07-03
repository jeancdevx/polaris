module "security_groups" {
  source = "../../modules/security-groups"

  project_name = var.project_name
  environment  = var.environment

  vpc_id         = module.vpc.vpc_id
  vpc_cidr_block = module.vpc.vpc_cidr_block

  alb_ingress_cidr_blocks = var.alb_ingress_cidr_blocks

  tags = var.tags
}

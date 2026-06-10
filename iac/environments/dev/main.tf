module "vpc" {
  source = "../../modules/vpc"

  environment  = var.environment
  project_name = var.project_name

  vpc_cidr = var.vpc_cidr
  azs      = var.azs

  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  data_subnet_cidrs    = var.data_subnet_cidrs

  enable_nat_gateway    = var.enable_nat_gateway
  single_nat_gateway    = var.single_nat_gateway
  enable_vpc_endpoints  = var.enable_vpc_endpoints
  vpc_endpoint_services = var.vpc_endpoint_services

  additional_tags = local.default_tags
}

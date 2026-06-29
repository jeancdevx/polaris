module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
  environment  = var.environment
  service_name = "api-service"

  tags = var.tags
}

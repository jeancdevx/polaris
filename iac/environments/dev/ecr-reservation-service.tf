module "ecr_reservation_service" {
  source = "../../modules/ecr"

  project_name = var.project_name
  environment  = var.environment
  service_name = "reservation-service"

  tags = var.tags
}

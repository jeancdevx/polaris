module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
  environment  = var.environment

  mfa_configuration           = var.cognito_mfa_configuration
  create_user_pool_domain     = var.cognito_create_user_pool_domain
  domain_prefix               = var.cognito_domain_prefix
  admin_create_user_only      = var.cognito_admin_create_user_only
  password_minimum_length     = var.cognito_password_minimum_length
  access_token_validity_hours = var.cognito_access_token_validity_hours
  id_token_validity_hours     = var.cognito_id_token_validity_hours
  refresh_token_validity_days = var.cognito_refresh_token_validity_days
  deletion_protection         = var.cognito_deletion_protection

  tags = var.tags
}

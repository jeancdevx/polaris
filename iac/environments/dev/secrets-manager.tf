module "secrets_manager" {
  source = "../../modules/secrets-manager"

  project_name = var.project_name
  environment  = var.environment

  rds_master_secret_arn    = module.rds.master_user_secret_arn
  rotation_lambda_role_arn = module.iam.secrets_rotation_role_arn

  enable_rds_rotation = var.secrets_manager_enable_rds_rotation
  rds_rotation_days   = var.secrets_manager_rds_rotation_days
  rotate_immediately  = var.secrets_manager_rotate_immediately

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  tags = var.tags
}

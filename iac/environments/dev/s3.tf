module "s3" {
  source = "../../modules/s3"

  project_name = var.project_name
  environment  = var.environment

  alb_logs_prefix                   = var.alb_logs_prefix
  force_destroy                     = var.s3_force_destroy
  kms_key_arn                       = var.s3_kms_key_arn
  lifecycle_glacier_transition_days = var.s3_lifecycle_glacier_transition_days

  tags = var.tags
}

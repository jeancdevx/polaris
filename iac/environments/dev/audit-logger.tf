module "audit_logger" {
  source = "../../modules/audit-logger"

  project_name = var.project_name
  environment  = var.environment

  lambda_role_arn        = module.iam.audit_logger_role_arn
  audit_logs_bucket_name = module.s3.audit_logs_bucket_name

  tags = var.tags

  depends_on = [
    module.iam,
    module.s3,
  ]
}

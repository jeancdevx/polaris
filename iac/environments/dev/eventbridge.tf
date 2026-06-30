module "eventbridge" {
  source = "../../modules/eventbridge"

  project_name = var.project_name
  environment  = var.environment

  audit_logger_function_arn  = module.audit_logger.function_arn
  audit_logger_function_name = module.audit_logger.function_name

  tags = var.tags

  depends_on = [
    module.audit_logger,
  ]
}

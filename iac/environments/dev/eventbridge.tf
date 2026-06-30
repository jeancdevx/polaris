module "eventbridge" {
  source = "../../modules/eventbridge"

  project_name = var.project_name
  environment  = var.environment

  audit_logger_function_arn  = module.audit_logger.function_arn
  audit_logger_function_name = module.audit_logger.function_name

  notification_sender_function_arn  = module.notification_sender.function_arn
  notification_sender_function_name = module.notification_sender.function_name
  notification_sender_dlq_arn       = module.sqs.queue_arns["dlq_notification_sender"]

  reservation_cleanup_function_arn  = module.reservation_cleanup.function_arn
  reservation_cleanup_function_name = module.reservation_cleanup.function_name

  health_checker_function_arn  = module.health_checker.function_arn
  health_checker_function_name = module.health_checker.function_name

  tags = var.tags

  depends_on = [
    module.audit_logger,
    module.notification_sender,
    module.reservation_cleanup,
    module.health_checker,
    module.sqs,
  ]
}

module "observability" {
  source = "../../modules/observability"

  project_name = var.project_name
  environment  = var.environment
  tags         = var.tags

  sns_alerts_topic_arn = module.sns.alerts_topic_arn

  ecs_cluster_name              = module.ecs.cluster_name
  ecs_service_names             = module.ecs.ecs_service_names
  alb_arn_suffix                = module.ecs.alb_arn_suffix
  alb_target_group_arn_suffixes = module.ecs.alb_target_group_arn_suffixes
  api_gateway_public_api_id     = module.api_gateway.api_id
  appsync_api_id                = module.appsync.api_id
  rds_cluster_identifier        = module.rds.cluster_id

  lambda_function_names = [
    module.health_checker.function_name,
    module.rfid_validator.function_name,
    module.sensor_data_processor.function_name,
    module.notification_sender.function_name,
    module.audit_logger.function_name,
    module.reservation_cleanup.function_name,
  ]

  sqs_dlq_queue_names = [
    module.sqs.queue_names.dlq_sensor_processing,
    module.sqs.queue_names.dlq_notification_sender,
  ]

  alarm_email_endpoints = var.observability_alarm_email_endpoints

  depends_on = [
    module.sns,
    module.ecs,
    module.api_gateway,
    module.appsync,
    module.rds,
  ]
}

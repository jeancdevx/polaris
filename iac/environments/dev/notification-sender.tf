module "notification_sender" {
  source = "../../modules/notification-sender"

  project_name = var.project_name
  environment  = var.environment

  lambda_role_arn      = module.iam.notification_sender_role_arn
  sns_alerts_topic_arn = module.sns.alerts_topic_arn

  tags = var.tags

  depends_on = [
    module.iam,
    module.sns,
  ]
}

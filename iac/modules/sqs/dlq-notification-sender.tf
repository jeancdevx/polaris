resource "aws_sqs_queue" "dlq_notification_sender" {
  name                       = "${local.name_prefix}-dlq-notification-sender"
  message_retention_seconds  = var.message_retention_seconds
  visibility_timeout_seconds = var.visibility_timeout_seconds
  sqs_managed_sse_enabled    = true

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-dlq-notification-sender"
    Purpose = "notification-sender-dead-letter"
  })
}

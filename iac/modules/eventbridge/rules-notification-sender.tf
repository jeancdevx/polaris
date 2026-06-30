resource "aws_cloudwatch_event_rule" "notification_sender" {
  for_each = var.notification_sender_rules

  name           = "${local.name_prefix}-${replace(each.value.detail_type, ".", "-")}-notify"
  description    = each.value.description
  event_bus_name = aws_cloudwatch_event_bus.main.name
  event_pattern = jsonencode({
    source      = each.value.sources
    detail-type = [each.value.detail_type]
  })

  tags = merge(local.common_tags, {
    Name       = "${local.name_prefix}-${replace(each.value.detail_type, ".", "-")}-notify"
    DetailType = each.value.detail_type
    Target     = "notification-sender"
  })
}

resource "aws_cloudwatch_event_target" "notification_sender" {
  for_each = var.notification_sender_rules

  rule           = aws_cloudwatch_event_rule.notification_sender[each.key].name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  target_id      = "notification-sender"
  arn            = var.notification_sender_function_arn

  dynamic "dead_letter_config" {
    for_each = var.notification_sender_dlq_arn != "" ? [1] : []

    content {
      arn = var.notification_sender_dlq_arn
    }
  }

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 2
  }
}

resource "aws_lambda_permission" "notification_sender" {
  for_each = var.notification_sender_rules

  statement_id  = "AllowExecutionFromEventBridge-${replace(each.value.detail_type, ".", "-")}-notify"
  action        = "lambda:InvokeFunction"
  function_name = var.notification_sender_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.notification_sender[each.key].arn
}

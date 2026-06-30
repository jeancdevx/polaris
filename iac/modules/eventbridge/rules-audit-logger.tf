resource "aws_cloudwatch_event_rule" "audit_logger" {
  for_each = var.audit_logger_rules

  name           = "${local.name_prefix}-${replace(each.value.detail_type, ".", "-")}-audit"
  description    = each.value.description
  event_bus_name = aws_cloudwatch_event_bus.main.name
  event_pattern = jsonencode({
    source      = [var.event_processor_source]
    detail-type = [each.value.detail_type]
  })

  tags = merge(local.common_tags, {
    Name       = "${local.name_prefix}-${replace(each.value.detail_type, ".", "-")}-audit"
    DetailType = each.value.detail_type
    Target     = "audit-logger"
  })
}

resource "aws_cloudwatch_event_target" "audit_logger" {
  for_each = var.audit_logger_rules

  rule           = aws_cloudwatch_event_rule.audit_logger[each.key].name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  target_id      = "audit-logger"
  arn            = var.audit_logger_function_arn
}

resource "aws_lambda_permission" "audit_logger" {
  for_each = var.audit_logger_rules

  statement_id  = "AllowExecutionFromEventBridge-${replace(each.value.detail_type, ".", "-")}"
  action        = "lambda:InvokeFunction"
  function_name = var.audit_logger_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.audit_logger[each.key].arn
}

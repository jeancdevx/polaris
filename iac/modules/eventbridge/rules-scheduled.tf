resource "aws_cloudwatch_event_rule" "reservation_cleanup_schedule" {
  name                = "${local.name_prefix}-reservation-cleanup"
  description         = "Expire active reservations past expires_at"
  schedule_expression = var.reservation_cleanup_schedule_expression

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-reservation-cleanup"
    Target = "reservation-cleanup"
  })
}

resource "aws_cloudwatch_event_target" "reservation_cleanup_schedule" {
  rule      = aws_cloudwatch_event_rule.reservation_cleanup_schedule.name
  target_id = "reservation-cleanup"
  arn       = var.reservation_cleanup_function_arn
}

resource "aws_lambda_permission" "reservation_cleanup_schedule" {
  statement_id  = "AllowExecutionFromEventBridge-reservation-cleanup"
  action        = "lambda:InvokeFunction"
  function_name = var.reservation_cleanup_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.reservation_cleanup_schedule.arn
}

resource "aws_cloudwatch_event_rule" "health_checker_schedule" {
  name                = "${local.name_prefix}-health-checker"
  description         = "Periodic dependency health checks"
  schedule_expression = var.health_checker_schedule_expression

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-health-checker"
    Target = "health-checker"
  })
}

resource "aws_cloudwatch_event_target" "health_checker_schedule" {
  rule      = aws_cloudwatch_event_rule.health_checker_schedule.name
  target_id = "health-checker"
  arn       = var.health_checker_function_arn
}

resource "aws_lambda_permission" "health_checker_schedule" {
  statement_id  = "AllowExecutionFromEventBridge-health-checker"
  action        = "lambda:InvokeFunction"
  function_name = var.health_checker_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_checker_schedule.arn
}

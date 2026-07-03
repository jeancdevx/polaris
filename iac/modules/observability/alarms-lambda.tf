resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = local.lambda_error_alarms

  alarm_name          = "${local.name_prefix}-lambda-errors-${each.key}"
  alarm_description   = "Lambda errors for ${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.key
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-lambda-errors-${each.key}"
    Function = each.key
  })
}

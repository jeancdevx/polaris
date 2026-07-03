resource "aws_cloudwatch_metric_alarm" "appsync_5xx" {
  count = var.enable_appsync_alarms ? 1 : 0

  alarm_name          = "${local.name_prefix}-appsync-5xx"
  alarm_description   = "AppSync GraphQL 5XX errors above threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "5XXError"
  namespace           = "AWS/AppSync"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = var.api_5xx_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    GraphQLAPIId = var.appsync_api_id
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-appsync-5xx"
  })
}

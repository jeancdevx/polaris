resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  count = var.enable_api_gateway_alarms ? 1 : 0

  alarm_name          = "${local.name_prefix}-api-gateway-5xx"
  alarm_description   = "Public API Gateway 5XX errors above threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = var.api_5xx_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiId = var.api_gateway_public_api_id
    Stage = var.api_gateway_stage_name
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-gateway-5xx"
  })
}

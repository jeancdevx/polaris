resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  for_each = toset(var.alb_target_group_arn_suffixes)

  alarm_name          = "${local.name_prefix}-alb-unhealthy-${replace(each.value, "targetgroup/", "")}"
  alarm_description   = "ALB target group has unhealthy hosts"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = each.value
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-unhealthy"
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_target_5xx" {
  count = var.alb_arn_suffix != "" ? 1 : 0

  alarm_name          = "${local.name_prefix}-alb-target-5xx"
  alarm_description   = "ALB target 5XX responses above threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = var.api_5xx_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-target-5xx"
  })
}

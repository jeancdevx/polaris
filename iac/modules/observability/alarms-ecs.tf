resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  for_each = local.ecs_cpu_alarms

  alarm_name          = "${local.name_prefix}-ecs-cpu-${replace(each.key, "${local.name_prefix}-", "")}"
  alarm_description   = "ECS CPU > ${var.ecs_cpu_threshold}% for ${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.ecs_cpu_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = each.key
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-ecs-cpu-${replace(each.key, "${local.name_prefix}-", "")}"
    Service = each.key
  })
}

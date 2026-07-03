resource "aws_cloudwatch_metric_alarm" "sqs_dlq_messages" {
  for_each = local.sqs_dlq_alarms

  alarm_name          = "${local.name_prefix}-sqs-dlq-${each.key}"
  alarm_description   = "Messages visible in DLQ ${each.key}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = each.key
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name  = "${local.name_prefix}-sqs-dlq-${each.key}"
    Queue = each.key
  })
}

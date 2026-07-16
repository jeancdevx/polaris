resource "aws_cloudwatch_log_metric_filter" "event_processor_consumer_failure" {
  count = var.event_processor_log_group_name != "" ? 1 : 0

  name           = "${local.name_prefix}-event-processor-consumer-failure"
  pattern        = "\"Kafka consumer stopped unexpectedly\""
  log_group_name = var.event_processor_log_group_name

  metric_transformation {
    name          = "KafkaConsumerUnexpectedStops"
    namespace     = "Polaris/EventProcessor"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

resource "aws_cloudwatch_metric_alarm" "event_processor_consumer_failure" {
  count = var.event_processor_log_group_name != "" ? 1 : 0

  alarm_name          = "${local.name_prefix}-event-processor-consumer-failure"
  alarm_description   = "Event processor Kafka consumer stopped unexpectedly"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "KafkaConsumerUnexpectedStops"
  namespace           = "Polaris/EventProcessor"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-event-processor-consumer-failure"
  })
}

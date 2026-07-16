resource "aws_cloudwatch_metric_alarm" "kafka_offline_partitions" {
  for_each = local.kafka_brokers

  alarm_name          = "${local.name_prefix}-kafka-offline-partitions-${each.key}"
  alarm_description   = "MSK broker ${each.key} reports offline partitions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "OfflinePartitionsCount"
  namespace           = "AWS/Kafka"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  treat_missing_data  = "breaching"

  dimensions = {
    "Cluster Name" = var.kafka_cluster_name
    "Broker ID"    = each.value
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-kafka-offline-partitions-${each.key}"
    BrokerId = each.value
  })
}

resource "aws_cloudwatch_metric_alarm" "kafka_disk_used_high" {
  for_each = local.kafka_brokers

  alarm_name          = "${local.name_prefix}-kafka-disk-high-${each.key}"
  alarm_description   = "MSK broker ${each.key} data disk usage exceeds 80%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "KafkaDataLogsDiskUsed"
  namespace           = "AWS/Kafka"
  period              = var.alarm_period_seconds
  statistic           = "Maximum"
  threshold           = 80
  treat_missing_data  = "breaching"

  dimensions = {
    "Cluster Name" = var.kafka_cluster_name
    "Broker ID"    = each.value
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-kafka-disk-high-${each.key}"
    BrokerId = each.value
  })
}

resource "aws_cloudwatch_metric_alarm" "kafka_consumer_lag" {
  for_each = var.kafka_cluster_name != "" ? var.kafka_topics : toset([])

  alarm_name          = "${local.name_prefix}-kafka-lag-${replace(each.key, ".", "-")}"
  alarm_description   = "Kafka consumer lag for ${var.kafka_consumer_group} on ${each.key} exceeds ${var.kafka_consumer_lag_threshold}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "MaxOffsetLag"
  namespace           = "AWS/Kafka"
  period              = var.alarm_period_seconds
  statistic           = "Maximum"
  threshold           = var.kafka_consumer_lag_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    "Cluster Name"   = var.kafka_cluster_name
    "Consumer Group" = var.kafka_consumer_group
    Topic            = each.value
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name  = "${local.name_prefix}-kafka-lag-${replace(each.key, ".", "-")}"
    Topic = each.value
  })
}

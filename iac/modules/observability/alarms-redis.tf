resource "aws_cloudwatch_metric_alarm" "redis_memory_high" {
  for_each = local.redis_cache_clusters

  alarm_name          = "${local.name_prefix}-redis-memory-high-${each.key}"
  alarm_description   = "Redis database memory usage exceeds ${var.redis_memory_threshold}% on ${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = var.alarm_period_seconds
  statistic           = "Maximum"
  threshold           = var.redis_memory_threshold
  treat_missing_data  = "breaching"

  dimensions = {
    CacheClusterId = each.value
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name           = "${local.name_prefix}-redis-memory-high-${each.key}"
    CacheClusterId = each.value
  })
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  for_each = local.redis_cache_clusters

  alarm_name          = "${local.name_prefix}-redis-evictions-${each.key}"
  alarm_description   = "Redis is evicting keys on ${each.key}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    CacheClusterId = each.value
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name           = "${local.name_prefix}-redis-evictions-${each.key}"
    CacheClusterId = each.value
  })
}

resource "aws_cloudwatch_metric_alarm" "redis_serverless_storage_high" {
  count = var.redis_serverless_cache_name != "" && var.redis_serverless_data_storage_threshold_bytes > 0 ? 1 : 0

  alarm_name          = "${local.name_prefix}-redis-serverless-storage-high"
  alarm_description   = "Serverless Redis data storage exceeds 80% of configured capacity"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "BytesUsedForCache"
  namespace           = "AWS/ElastiCache"
  period              = var.alarm_period_seconds
  statistic           = "Maximum"
  threshold           = var.redis_serverless_data_storage_threshold_bytes
  treat_missing_data  = "breaching"

  dimensions = {
    CacheName = var.redis_serverless_cache_name
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-serverless-storage-high"
  })
}

resource "aws_cloudwatch_metric_alarm" "redis_serverless_evictions" {
  count = var.redis_serverless_cache_name != "" ? 1 : 0

  alarm_name          = "${local.name_prefix}-redis-serverless-evictions"
  alarm_description   = "Serverless Redis is evicting keys"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    CacheName = var.redis_serverless_cache_name
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-serverless-evictions"
  })
}

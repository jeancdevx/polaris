locals {
  name_prefix = "${var.project_name}-${var.environment}"

  cluster_name = coalesce(var.cluster_name, "${local.name_prefix}-kafka")

  broker_instance_type = coalesce(
    var.broker_instance_type,
    var.environment == "prod" ? "kafka.m5.xlarge" : "kafka.m5.large"
  )

  broker_count = coalesce(var.broker_count, 3)

  broker_volume_size_gb = coalesce(
    var.broker_volume_size_gb,
    var.environment == "prod" ? 500 : 100
  )

  log_retention_hours = coalesce(
    var.log_retention_hours,
    var.environment == "dev" ? 168 : var.environment == "staging" ? 168 : 336
  )

  default_replication_factor = coalesce(var.default_replication_factor, 3)

  min_insync_replicas = coalesce(var.min_insync_replicas, 2)

  default_num_partitions = coalesce(var.default_num_partitions, 3)

  enhanced_monitoring = coalesce(
    var.enhanced_monitoring,
    var.environment == "prod" ? "PER_TOPIC_PER_BROKER" : "DEFAULT"
  )

  cloudwatch_log_retention_days = coalesce(
    var.cloudwatch_log_retention_days,
    var.environment == "prod" ? 30 : 7
  )

  server_properties = join("\n", [
    "auto.create.topics.enable=false",
    "default.replication.factor=${local.default_replication_factor}",
    "min.insync.replicas=${local.min_insync_replicas}",
    "log.retention.hours=${local.log_retention_hours}",
    "num.partitions=${local.default_num_partitions}",
  ])

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "kafka"
    }
  )
}

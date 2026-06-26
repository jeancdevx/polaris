module "kafka" {
  source = "../../modules/kafka"

  project_name = var.project_name
  environment  = var.environment

  kafka_version              = var.kafka_version
  broker_count               = var.kafka_broker_count
  broker_instance_type       = var.kafka_broker_instance_type
  broker_volume_size_gb      = var.kafka_broker_volume_size_gb
  log_retention_hours        = var.kafka_log_retention_hours
  default_replication_factor = var.kafka_default_replication_factor
  min_insync_replicas        = var.kafka_min_insync_replicas
  default_num_partitions     = var.kafka_default_num_partitions

  subnet_ids         = module.vpc.data_subnet_ids
  security_group_ids = [module.security_groups.msk_security_group_id]

  tags = var.tags
}

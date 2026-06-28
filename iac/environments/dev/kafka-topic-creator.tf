module "kafka_topic_creator" {
  source = "../../modules/kafka-topic-creator"

  project_name = var.project_name
  environment  = var.environment

  lambda_role_arn   = module.iam.kafka_topic_creator_role_arn
  bootstrap_brokers = module.kafka.bootstrap_brokers_sasl_iam

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  num_partitions      = coalesce(var.kafka_default_num_partitions, 3)
  replication_factor  = coalesce(var.kafka_default_replication_factor, 3)
  min_insync_replicas = coalesce(var.kafka_min_insync_replicas, 2)

  invoke_on_deploy = var.kafka_topic_creator_invoke_on_deploy

  tags = var.tags

  depends_on = [module.iam]
}

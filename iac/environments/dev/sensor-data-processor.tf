module "sensor_data_processor" {
  source = "../../modules/sensor-data-processor"

  project_name = var.project_name
  environment  = var.environment

  lambda_role_arn            = module.iam.sensor_data_processor_role_arn
  bootstrap_brokers          = module.kafka.bootstrap_brokers_sasl_iam
  sensor_readings_table_name = module.dynamodb.table_names.SensorReadings

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  tags = var.tags

  depends_on = [
    module.iam,
    module.kafka_topic_creator,
  ]
}

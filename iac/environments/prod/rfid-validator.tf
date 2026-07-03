module "rfid_validator" {
  source = "../../modules/rfid-validator"

  project_name = var.project_name
  environment  = var.environment

  lambda_role_arn             = module.iam.rfid_validator_role_arn
  bootstrap_brokers           = module.kafka.bootstrap_brokers_sasl_iam
  rfid_validations_table_name = module.dynamodb.table_names.RFIDValidations
  rds_master_secret_arn       = module.rds.master_user_secret_arn
  rds_cluster_endpoint        = module.rds.cluster_endpoint
  rds_database_name           = module.rds.database_name

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  tags = var.tags

  depends_on = [
    module.iam,
    module.kafka_topic_creator,
  ]
}

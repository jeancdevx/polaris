module "rds" {
  source = "../../modules/rds"

  project_name            = var.project_name
  environment             = var.environment
  engine_version          = var.rds_engine_version
  capacity_mode           = var.rds_capacity_mode
  serverless_min_capacity = var.rds_serverless_min_capacity
  serverless_max_capacity = var.rds_serverless_max_capacity
  reader_count            = var.rds_reader_count
  writer_instance_class   = var.rds_writer_instance_class
  backup_retention_period = var.rds_backup_retention_period
  deletion_protection     = var.rds_deletion_protection
  subnet_ids              = module.vpc.data_subnet_ids
  vpc_security_group_ids  = [module.security_groups.rds_security_group_id]
  monitoring_role_arn     = module.iam.rds_enhanced_monitoring_role_arn
  tags                    = var.tags
}

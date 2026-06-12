resource "aws_rds_cluster" "main" {
  cluster_identifier = "${local.name}-aurora"

  engine         = "aurora-postgresql"
  engine_version = var.engine_version
  engine_mode    = "provisioned"

  database_name        = var.db_name
  master_username      = var.db_username
  master_password      = var.db_password
  db_subnet_group_name = aws_db_subnet_group.main.name

  storage_type = var.storage_type

  storage_encrypted = true
  kms_key_id        = aws_kms_key.aurora[0].arn

  vpc_security_group_ids = [aws_security_group.aurora[0].id]

  backup_retention_period      = var.backup_retention_period
  preferred_backup_window      = var.backup_window
  preferred_maintenance_window = var.maintenance_window

  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${local.name}-aurora-final-snapshot"

  enable_http_endpoint = var.scalability_type == "serverless-v2"

  dynamic "serverlessv2_scaling_configuration" {
    for_each = var.scalability_type == "serverless-v2" ? [1] : []
    content {
      min_capacity = var.serverless_min_acu
      max_capacity = var.serverless_max_acu
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-aurora"
  })

  lifecycle {
    ignore_changes = [
      master_password,
      scaling_configuration,
    ]
  }
}

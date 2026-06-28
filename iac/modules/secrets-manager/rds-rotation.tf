resource "aws_secretsmanager_secret_rotation" "rds_master" {
  count = local.enable_rds_rotation ? 1 : 0

  secret_id = var.rds_master_secret_arn

  rotation_rules {
    automatically_after_days = local.rds_rotation_days
  }

  rotate_immediately = local.rotate_immediately
}

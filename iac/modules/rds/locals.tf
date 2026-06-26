locals {
  name_prefix = "${var.project_name}-${var.environment}"

  capacity_mode = coalesce(
    var.capacity_mode,
    var.environment == "dev" ? "serverless" : "provisioned"
  )

  use_serverless = local.capacity_mode == "serverless"

  reader_count = coalesce(
    var.reader_count,
    local.use_serverless ? 0 : var.environment == "prod" ? 2 : 1
  )

  backup_retention_period = coalesce(
    var.backup_retention_period,
    var.environment == "prod" ? 30 : var.environment == "staging" ? 14 : 7
  )

  deletion_protection = coalesce(
    var.deletion_protection,
    var.environment != "dev"
  )

  skip_final_snapshot = coalesce(
    var.skip_final_snapshot,
    var.environment == "dev"
  )

  performance_insights_enabled = coalesce(
    var.performance_insights_enabled,
    var.environment != "dev"
  )

  writer_instance_class = coalesce(
    var.writer_instance_class,
    var.environment == "prod" ? "db.r6g.xlarge" : "db.t4g.medium"
  )

  reader_instance_class = coalesce(
    var.reader_instance_class,
    local.writer_instance_class
  )

  common_tags = merge(
    var.tags,
    {
      Project      = var.project_name
      Environment  = var.environment
      ManagedBy    = "terraform"
      Component    = "rds"
      CapacityMode = local.capacity_mode
    }
  )
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  enable_rds_rotation = coalesce(
    var.enable_rds_rotation,
    true
  )

  rds_rotation_days = coalesce(
    var.rds_rotation_days,
    30
  )

  rotate_immediately = coalesce(
    var.rotate_immediately,
    var.environment != "dev"
  )
}

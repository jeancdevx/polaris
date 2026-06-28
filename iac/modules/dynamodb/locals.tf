locals {
  name_prefix = "${var.project_name}-${var.environment}"

  billing_mode = coalesce(
    var.billing_mode,
    var.environment == "dev" ? "PAY_PER_REQUEST" : "PROVISIONED"
  )

  use_on_demand = local.billing_mode == "PAY_PER_REQUEST"

  read_capacity = coalesce(
    var.read_capacity,
    var.environment == "prod" ? 10 : 5
  )

  write_capacity = coalesce(
    var.write_capacity,
    var.environment == "prod" ? 10 : 5
  )

  autoscaling_max_read_capacity = coalesce(
    var.autoscaling_max_read_capacity,
    var.environment == "prod" ? 100 : 50
  )

  autoscaling_max_write_capacity = coalesce(
    var.autoscaling_max_write_capacity,
    var.environment == "prod" ? 100 : 50
  )

  point_in_time_recovery_enabled = coalesce(
    var.point_in_time_recovery_enabled,
    var.environment != "dev"
  )

  deletion_protection_enabled = coalesce(
    var.deletion_protection_enabled,
    var.environment == "prod"
  )

  table_names = [
    aws_dynamodb_table.rfid_validations.name,
    aws_dynamodb_table.sensor_readings.name,
    aws_dynamodb_table.websocket_connections.name
  ]

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "dynamodb"
      BillingMode = local.billing_mode
    }
  )
}

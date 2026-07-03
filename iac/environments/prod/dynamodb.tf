module "dynamodb" {
  source = "../../modules/dynamodb"

  project_name = var.project_name
  environment  = var.environment

  billing_mode                      = var.dynamodb_billing_mode
  read_capacity                     = var.dynamodb_read_capacity
  write_capacity                    = var.dynamodb_write_capacity
  autoscaling_max_read_capacity     = var.dynamodb_autoscaling_max_read_capacity
  autoscaling_max_write_capacity    = var.dynamodb_autoscaling_max_write_capacity
  point_in_time_recovery_enabled    = var.dynamodb_point_in_time_recovery_enabled
  deletion_protection_enabled       = var.dynamodb_deletion_protection_enabled
  sensor_readings_ttl_enabled       = var.dynamodb_sensor_readings_ttl_enabled
  websocket_connections_ttl_enabled = var.dynamodb_websocket_connections_ttl_enabled

  tags = var.tags
}

resource "aws_dynamodb_table" "sensor_readings" {
  name         = "${local.name_prefix}-SensorReadings"
  billing_mode = local.billing_mode

  read_capacity  = local.use_on_demand ? null : local.read_capacity
  write_capacity = local.use_on_demand ? null : local.write_capacity

  hash_key  = "sensorId"
  range_key = "timestamp"

  attribute {
    name = "sensorId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  dynamic "ttl" {
    for_each = var.sensor_readings_ttl_enabled ? [1] : []

    content {
      attribute_name = var.sensor_readings_ttl_attribute_name
      enabled        = true
    }
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn != "" ? var.kms_key_arn : null
  }

  point_in_time_recovery {
    enabled = local.point_in_time_recovery_enabled
  }

  deletion_protection_enabled = local.deletion_protection_enabled

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-SensorReadings"
  })
}

resource "aws_dynamodb_table" "rfid_validations" {
  name         = "${local.name_prefix}-RFIDValidations"
  billing_mode = local.billing_mode

  read_capacity  = local.use_on_demand ? null : local.read_capacity
  write_capacity = local.use_on_demand ? null : local.write_capacity

  hash_key = "rfid_uid"

  attribute {
    name = "rfid_uid"
    type = "S"
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
    Name = "${local.name_prefix}-RFIDValidations"
  })
}

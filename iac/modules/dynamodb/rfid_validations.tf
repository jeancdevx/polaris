resource "aws_dynamodb_table" "rfid_validations" {
  name         = "${local.name}-rfid-validations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "rfid_uid"

  attribute {
    name = "rfid_uid"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  tags = merge(local.common_tags, {
    Name        = "${local.name}-rfid-validations"
    Description = "RFID tag validation records"
  })
}

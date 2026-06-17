resource "aws_dynamodb_table" "websocket_connections" {
  name         = "${local.name}-websocket-connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connection_id"

  attribute {
    name = "connection_id"
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
    Name        = "${local.name}-websocket-connections"
    Description = "Active WebSocket connections for AppSync"
  })
}

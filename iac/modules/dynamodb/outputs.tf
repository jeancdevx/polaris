output "billing_mode" {
  description = "Active DynamoDB billing mode"
  value       = local.billing_mode
}

output "table_arns" {
  description = "Map of DynamoDB table logical names to ARNs"
  value = {
    RFIDValidations      = aws_dynamodb_table.rfid_validations.arn
    SensorReadings       = aws_dynamodb_table.sensor_readings.arn
    WebSocketConnections = aws_dynamodb_table.websocket_connections.arn
  }
}

output "table_names" {
  description = "Map of DynamoDB table logical names to table names"
  value = {
    RFIDValidations      = aws_dynamodb_table.rfid_validations.name
    SensorReadings       = aws_dynamodb_table.sensor_readings.name
    WebSocketConnections = aws_dynamodb_table.websocket_connections.name
  }
}

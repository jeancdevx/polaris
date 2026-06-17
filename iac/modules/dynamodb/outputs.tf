output "rfid_validations_table_name" {
  description = "Name of the RFID validations table"
  value       = aws_dynamodb_table.rfid_validations.name
}

output "rfid_validations_table_arn" {
  description = "ARN of the RFID validations table"
  value       = aws_dynamodb_table.rfid_validations.arn
}

output "sensor_readings_table_name" {
  description = "Name of the sensor readings table"
  value       = aws_dynamodb_table.sensor_readings.name
}

output "sensor_readings_table_arn" {
  description = "ARN of the sensor readings table"
  value       = aws_dynamodb_table.sensor_readings.arn
}

output "websocket_connections_table_name" {
  description = "Name of the WebSocket connections table"
  value       = aws_dynamodb_table.websocket_connections.name
}

output "websocket_connections_table_arn" {
  description = "ARN of the WebSocket connections table"
  value       = aws_dynamodb_table.websocket_connections.arn
}

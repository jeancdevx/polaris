output "data_endpoint" {
  description = "AWS IoT Core ATS data endpoint for MQTT clients"
  value       = data.aws_iot_endpoint.data_ats.endpoint_address
}

output "device_policy_name" {
  description = "IoT policy attached to simulator device certificates"
  value       = aws_iot_policy.device.name
}

output "sensor_occupancy_rule_names" {
  description = "IoT topic rule names that invoke sensor-data-processor"
  value = {
    for key, rule in aws_iot_topic_rule.sensor_data_processor :
    key => rule.name
  }
}

output "rfid_rule_names" {
  description = "IoT topic rule names keyed by rule key"
  value = {
    for key, rule in aws_iot_topic_rule.rfid_validator :
    key => rule.name
  }
}

output "simulator_certificate_arn" {
  description = "ARN of the Terraform-managed simulator device certificate"
  value       = aws_iot_certificate.simulator.arn
}

output "simulator_certificate_pem" {
  description = "PEM-encoded simulator device certificate"
  value       = aws_iot_certificate.simulator.certificate_pem
  sensitive   = true
}

output "simulator_device_id" {
  description = "Logical device ID used by the simulator thing"
  value       = var.simulator_device_id
}

output "simulator_private_key" {
  description = "PEM-encoded private key for the simulator device certificate"
  value       = aws_iot_certificate.simulator.private_key
  sensitive   = true
}

output "simulator_public_key" {
  description = "PEM-encoded public key for the simulator device certificate"
  value       = aws_iot_certificate.simulator.public_key
  sensitive   = true
}

output "simulator_thing_name" {
  description = "AWS IoT thing name for the device simulator"
  value       = aws_iot_thing.simulator.name
}

output "topic_patterns" {
  description = "Primary MQTT topic patterns provisioned for Polaris devices"
  value = {
    rfid_entry     = "parking/rfid/entry/+"
    rfid_exit      = "parking/rfid/exit/+"
    rfid_proximity = "parking/rfid/entry/proximity"
    sensor_occ     = "parking/sensors/occupancy/+"
    cmd_servo      = "parking/commands/servo/+"
    cmd_display    = "parking/commands/display/+"
    cmd_led        = "parking/commands/led/+"
  }
}

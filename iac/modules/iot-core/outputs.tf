output "data_endpoint" {
  description = "AWS IoT Core ATS data endpoint for MQTT clients"
  value       = data.aws_iot_endpoint.data_ats.endpoint_address
}

output "device_policy_name" {
  description = "Least-privilege IoT policy names keyed by ESP32 device"
  value = {
    for key, policy in aws_iot_policy.device : key => policy.name
  }
}

output "device_ids" {
  description = "Logical device IDs keyed by device map key (flash + MQTT deviceId)"
  value = {
    for key, device in var.devices : key => device.device_id
  }
}

output "device_thing_names" {
  description = "AWS IoT thing names keyed by device map key (e.g. entry-io-01)"
  value = {
    for key, thing in aws_iot_thing.device : key => thing.name
  }
}

output "device_certificate_arns" {
  description = "IoT certificate ARNs keyed by device map key"
  value = {
    for key, cert in aws_iot_certificate.device : key => cert.arn
  }
}

output "device_certificate_pems" {
  description = "PEM-encoded device certificates keyed by device map key"
  value = {
    for key, cert in aws_iot_certificate.device : key => cert.certificate_pem
  }
  sensitive = true
}

output "device_private_keys" {
  description = "PEM-encoded private keys keyed by device map key (flash once per ESP32; stored in Terraform state)"
  value = {
    for key, cert in aws_iot_certificate.device : key => cert.private_key
  }
  sensitive = true
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
  description = "ARN of the primary entry device certificate (legacy output name for smoke scripts)"
  value       = aws_iot_certificate.device[local.primary_device_key].arn
}

output "simulator_certificate_pem" {
  description = "PEM-encoded primary entry device certificate (legacy output name for smoke scripts)"
  value       = aws_iot_certificate.device[local.primary_device_key].certificate_pem
  sensitive   = true
}

output "simulator_device_id" {
  description = "Logical device ID for primary entry device (legacy output name for smoke scripts)"
  value       = var.devices[local.primary_device_key].device_id
}

output "simulator_private_key" {
  description = "PEM-encoded private key for entry-gate (legacy output name for smoke scripts)"
  value       = aws_iot_certificate.device[local.primary_device_key].private_key
  sensitive   = true
}

output "simulator_public_key" {
  description = "PEM-encoded public key for entry-gate (legacy output name for smoke scripts)"
  value       = aws_iot_certificate.device[local.primary_device_key].public_key
  sensitive   = true
}

output "simulator_thing_name" {
  description = "AWS IoT thing name for primary entry device (legacy output name for smoke scripts)"
  value       = aws_iot_thing.device[local.primary_device_key].name
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

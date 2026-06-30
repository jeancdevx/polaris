variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "sensor_data_processor_function_arn" {
  description = "ARN of the sensor-data-processor Lambda invoked by occupancy IoT rules"
  type        = string
}

variable "sensor_data_processor_function_name" {
  description = "Name of the sensor-data-processor Lambda invoked by occupancy IoT rules"
  type        = string
}

variable "sensor_occupancy_rules" {
  description = "IoT topic rules that route FC-51 occupancy telemetry to sensor-data-processor"
  type = map(object({
    description = string
    topic       = string
  }))

  default = {
    sensor_occupancy = {
      description = "Route FC-51 occupancy changes to sensor-data-processor"
      topic       = "parking/sensors/occupancy/+"
    }
  }
}

variable "rfid_validator_function_arn" {
  description = "ARN of the rfid-validator Lambda invoked by RFID IoT rules"
  type        = string
}

variable "rfid_validator_function_name" {
  description = "Name of the rfid-validator Lambda invoked by RFID IoT rules"
  type        = string
}

variable "rfid_rules" {
  description = "IoT topic rules that route RFID scans to rfid-validator"
  type = map(object({
    description = string
    topic       = string
  }))

  default = {
    rfid_entry = {
      description = "Route RFID entry scans to rfid-validator"
      topic       = "parking/rfid/entry/+"
    }
    rfid_exit = {
      description = "Route RFID exit scans to rfid-validator"
      topic       = "parking/rfid/exit/+"
    }
  }
}

variable "simulator_device_id" {
  description = "Logical device ID for the Terraform-managed simulator thing"
  type        = string
  default     = "entry-gate-01"
}

variable "tags" {
  description = "Additional tags applied to IoT resources"
  type        = map(string)
  default     = {}
}

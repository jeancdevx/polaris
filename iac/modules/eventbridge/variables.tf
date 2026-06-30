variable "audit_logger_function_arn" {
  description = "ARN of the audit-logger Lambda invoked by parking event rules"
  type        = string
}

variable "audit_logger_function_name" {
  description = "Name of the audit-logger Lambda invoked by parking event rules"
  type        = string
}

variable "audit_logger_rules" {
  description = "EventBridge rules that route event-processor events to audit-logger"
  type = map(object({
    detail_type = string
    description = string
  }))

  default = {
    sensor_occupancy = {
      detail_type = "sensor.occupancy"
      description = "Route sensor.occupancy events to audit-logger"
    }
    vehicle_entry = {
      detail_type = "vehicle.entry"
      description = "Route vehicle.entry events to audit-logger"
    }
    vehicle_exit = {
      detail_type = "vehicle.exit"
      description = "Route vehicle.exit events to audit-logger"
    }
  }
}

variable "bus_name" {
  description = "Custom EventBridge bus name"
  type        = string
  default     = "polaris-events"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "event_processor_source" {
  description = "EventBridge source emitted by event-processor-service"
  type        = string
  default     = "polaris.event-processor"
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "tags" {
  description = "Additional tags applied to EventBridge resources"
  type        = map(string)
  default     = {}
}

variable "appsync_occupancy_publisher_function_arn" {
  description = "ARN of the appsync-occupancy-publisher Lambda invoked by sensor.occupancy rule"
  type        = string
}

variable "appsync_occupancy_publisher_function_name" {
  description = "Name of the appsync-occupancy-publisher Lambda invoked by sensor.occupancy rule"
  type        = string
}

variable "audit_logger_function_arn" {
  description = "ARN of the audit-logger Lambda invoked by parking event rules"
  type        = string
}

variable "audit_logger_function_name" {
  description = "Name of the audit-logger Lambda invoked by parking event rules"
  type        = string
}

variable "health_checker_function_arn" {
  description = "ARN of the health-checker Lambda invoked by the schedule rule"
  type        = string
}

variable "health_checker_function_name" {
  description = "Name of the health-checker Lambda invoked by the schedule rule"
  type        = string
}

variable "health_checker_schedule_expression" {
  description = "EventBridge schedule for health-checker"
  type        = string
  default     = "rate(1 minute)"
}

variable "notification_sender_dlq_arn" {
  description = "SQS DLQ ARN for failed notification-sender invocations"
  type        = string
  default     = ""
}

variable "notification_sender_function_arn" {
  description = "ARN of the notification-sender Lambda invoked by notification rules"
  type        = string
}

variable "notification_sender_function_name" {
  description = "Name of the notification-sender Lambda invoked by notification rules"
  type        = string
}

variable "notification_sender_rules" {
  description = "EventBridge rules that route reservation events to notification-sender"
  type = map(object({
    detail_type = string
    description = string
    sources     = list(string)
  }))

  default = {
    reservation_created = {
      detail_type = "reservation.created"
      description = "Route reservation.created events to notification-sender"
      sources = [
        "polaris.reservation-service",
        "polaris.event-processor",
        "polaris.smoke"
      ]
    }
    reservation_cancelled = {
      detail_type = "reservation.cancelled"
      description = "Route reservation.cancelled events to notification-sender"
      sources = [
        "polaris.reservation-service",
        "polaris.reservation-cleanup",
        "polaris.event-processor",
        "polaris.smoke"
      ]
    }
  }
}

variable "reservation_cleanup_function_arn" {
  description = "ARN of the reservation-cleanup Lambda invoked by the schedule rule"
  type        = string
}

variable "reservation_cleanup_function_name" {
  description = "Name of the reservation-cleanup Lambda invoked by the schedule rule"
  type        = string
}

variable "reservation_cleanup_schedule_expression" {
  description = "EventBridge schedule for reservation-cleanup"
  type        = string
  default     = "rate(5 minutes)"
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

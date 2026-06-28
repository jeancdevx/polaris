variable "autoscaling_max_read_capacity" {
  description = "Maximum read capacity units for autoscaling in provisioned mode"
  type        = number
  default     = null
}

variable "autoscaling_max_write_capacity" {
  description = "Maximum write capacity units for autoscaling in provisioned mode"
  type        = number
  default     = null
}

variable "autoscaling_target_read_utilization" {
  description = "Target read utilization percentage for DynamoDB autoscaling"
  type        = number
  default     = 70
}

variable "autoscaling_target_write_utilization" {
  description = "Target write utilization percentage for DynamoDB autoscaling"
  type        = number
  default     = 70
}

variable "billing_mode" {
  description = "DynamoDB billing mode: PAY_PER_REQUEST or PROVISIONED. Auto-selected when null."
  type        = string
  default     = null

  validation {
    condition     = var.billing_mode == null ? true : contains(["PAY_PER_REQUEST", "PROVISIONED"], var.billing_mode)
    error_message = "billing_mode must be PAY_PER_REQUEST or PROVISIONED."
  }
}

variable "deletion_protection_enabled" {
  description = "Enable deletion protection on DynamoDB tables"
  type        = bool
  default     = null
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "kms_key_arn" {
  description = "KMS key ARN for DynamoDB server-side encryption. Uses AWS owned key when empty."
  type        = string
  default     = ""
}

variable "point_in_time_recovery_enabled" {
  description = "Enable point-in-time recovery on DynamoDB tables"
  type        = bool
  default     = null
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "read_capacity" {
  description = "Initial read capacity per table in provisioned mode"
  type        = number
  default     = null
}

variable "sensor_readings_ttl_enabled" {
  description = "Enable TTL on sensor readings for automatic telemetry expiry"
  type        = bool
  default     = true
}

variable "sensor_readings_ttl_attribute_name" {
  description = "TTL attribute name for sensor readings"
  type        = string
  default     = "expiresAt"
}

variable "tags" {
  description = "Additional tags applied to DynamoDB tables"
  type        = map(string)
  default     = {}
}

variable "websocket_connections_ttl_enabled" {
  description = "Enable TTL on websocket connection records"
  type        = bool
  default     = true
}

variable "websocket_connections_ttl_attribute_name" {
  description = "TTL attribute name for websocket connections"
  type        = string
  default     = "ttl"
}

variable "write_capacity" {
  description = "Initial write capacity per table in provisioned mode"
  type        = number
  default     = null
}

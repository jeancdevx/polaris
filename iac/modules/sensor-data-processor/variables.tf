variable "bootstrap_brokers" {
  description = "MSK bootstrap brokers for IAM SASL authentication"
  type        = string
}

variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray active tracing for the Lambda function"
  type        = bool
  default     = true
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "function_name" {
  description = "Override for the Lambda function name"
  type        = string
  default     = null
}

variable "lambda_role_arn" {
  description = "IAM role ARN for the sensor-data-processor Lambda"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = null
}

variable "powertools_log_level" {
  description = "Powertools Logger log level"
  type        = string
  default     = "INFO"
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "repository_root" {
  description = "Monorepo root path used to build the Lambda package"
  type        = string
  default     = null
}

variable "security_group_ids" {
  description = "Security group IDs for Lambda VPC configuration"
  type        = list(string)
}

variable "sensor_readings_table_name" {
  description = "DynamoDB SensorReadings table name"
  type        = string
}

variable "sensor_readings_ttl_days" {
  description = "TTL in days for SensorReadings items (0 disables expiresAt)"
  type        = number
  default     = 90
}

variable "subnet_ids" {
  description = "Private subnet IDs for Lambda VPC configuration"
  type        = list(string)
}

variable "tags" {
  description = "Additional tags applied to Lambda resources"
  type        = map(string)
  default     = {}
}

variable "timeout_seconds" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 60
}

variable "led_commands_enabled" {
  description = "Publish MQTT LED commands when occupancy changes or on sync-request"
  type        = bool
  default     = true
}

variable "redis_url" {
  description = "Redis URL for LED sync-request handling"
  type        = string
  default     = null
}

variable "iot_data_endpoint" {
  description = "AWS IoT data endpoint for LED command publishing"
  type        = string
  default     = null
}

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
  description = "IAM role ARN for the notification-sender Lambda"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = null
}

variable "notifications_enabled" {
  description = "Enable notification delivery (log/SNS stub in dev)"
  type        = bool
  default     = true
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

variable "sns_alerts_topic_arn" {
  description = "Optional SNS topic for push notification stub"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags applied to Lambda resources"
  type        = map(string)
  default     = {}
}

variable "timeout_seconds" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 15
}

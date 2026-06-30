variable "audit_log_group_name" {
  description = "CloudWatch log group for structured audit records"
  type        = string
  default     = "/polaris/audit"
}

variable "audit_log_retention_days" {
  description = "Retention for the /polaris/audit log group"
  type        = number
  default     = null
}

variable "audit_logs_bucket_name" {
  description = "S3 bucket name for audit archives"
  type        = string
}

variable "audit_s3_prefix" {
  description = "Prefix for audit objects in S3"
  type        = string
  default     = "audit"
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
  description = "IAM role ARN for the audit-logger Lambda"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days for Lambda execution logs"
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

variable "tags" {
  description = "Additional tags applied to Lambda resources"
  type        = map(string)
  default     = {}
}

variable "timeout_seconds" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

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

variable "eventbridge_bus_name" {
  description = "Custom EventBridge bus name for notification events"
  type        = string
  default     = "polaris-events"
}

variable "function_name" {
  description = "Override for the Lambda function name"
  type        = string
  default     = null
}

variable "lambda_role_arn" {
  description = "IAM role ARN for the reservation-cleanup Lambda"
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

variable "rds_cluster_endpoint" {
  description = "Aurora cluster endpoint hostname"
  type        = string
}

variable "rds_cluster_port" {
  description = "Aurora cluster port"
  type        = number
  default     = 5432
}

variable "rds_database_name" {
  description = "Aurora database name"
  type        = string
}

variable "rds_master_secret_arn" {
  description = "Secrets Manager ARN for Aurora master credentials"
  type        = string
}

variable "redis_url" {
  description = "Redis connection URL"
  type        = string
  sensitive   = true
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

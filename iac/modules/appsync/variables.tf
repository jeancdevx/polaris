variable "api_name" {
  description = "Override for the AppSync GraphQL API name"
  type        = string
  default     = null
}

variable "api_key_ttl_hours" {
  description = "Hours until the optional AppSync API key expires"
  type        = number
  default     = 8760
}

variable "availability_lambda_function_arn" {
  description = "ARN of the appsync-availability Lambda resolver"
  type        = string
}

variable "availability_lambda_function_name" {
  description = "Name of the appsync-availability Lambda resolver"
  type        = string
}

variable "aws_region" {
  description = "AWS region for Cognito user pool config"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito user pool ID for default AppSync authentication"
  type        = string
}

variable "create_api_key" {
  description = "Create an API key for smoke tests and unauthenticated read in dev"
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

variable "log_retention_days" {
  description = "CloudWatch log retention for AppSync field logs"
  type        = number
  default     = 14
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "tags" {
  description = "Additional tags applied to AppSync resources"
  type        = map(string)
  default     = {}
}

variable "xray_enabled" {
  description = "Enable AWS X-Ray tracing for AppSync"
  type        = bool
  default     = true
}

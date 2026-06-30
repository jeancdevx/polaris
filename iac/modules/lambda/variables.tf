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

variable "environment_variables" {
  description = "Lambda environment variables"
  type        = map(string)
  default     = {}
}

variable "filename" {
  description = "Path to the deployment package zip"
  type        = string
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "handler" {
  description = "Lambda handler entrypoint"
  type        = string
  default     = "index.handler"
}

variable "lambda_role_arn" {
  description = "IAM role ARN assumed by the Lambda function"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days for Lambda execution logs"
  type        = number
  default     = null
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256
}

variable "powertools_log_level" {
  description = "Powertools Logger log level when used by the function"
  type        = string
  default     = "INFO"
}

variable "powertools_metrics_namespace" {
  description = "Powertools metrics namespace when used by the function"
  type        = string
  default     = "Polaris"
}

variable "powertools_service_name" {
  description = "Powertools service name override. Defaults to function_name."
  type        = string
  default     = null
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "runtime" {
  description = "Lambda runtime identifier"
  type        = string
  default     = "nodejs24.x"
}

variable "security_group_ids" {
  description = "Security group IDs for VPC-enabled Lambdas"
  type        = list(string)
  default     = []
}

variable "source_code_hash" {
  description = "Base64-encoded SHA256 hash of the deployment package"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for VPC-enabled Lambdas"
  type        = list(string)
  default     = []
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

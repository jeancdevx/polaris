variable "bootstrap_brokers" {
  description = "MSK bootstrap brokers for IAM SASL authentication"
  type        = string
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

variable "invoke_on_deploy" {
  description = "Invoke the Lambda after deploy to ensure MSK topics exist"
  type        = bool
  default     = true
}

variable "lambda_role_arn" {
  description = "IAM role ARN for the kafka-topic-creator Lambda"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = null
}

variable "min_insync_replicas" {
  description = "min.insync.replicas topic configuration"
  type        = number
}

variable "num_partitions" {
  description = "Number of partitions per topic"
  type        = number
}

variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray active tracing for the Lambda function"
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

variable "replication_factor" {
  description = "Replication factor per topic"
  type        = number
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
  default     = 120
}

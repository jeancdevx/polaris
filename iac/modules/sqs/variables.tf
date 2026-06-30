variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "message_retention_seconds" {
  description = "Default SQS message retention in seconds"
  type        = number
  default     = 345600
}

variable "project_name" {
  description = "Project name used for queue naming and tags"
  type        = string
  default     = "polaris"
}

variable "tags" {
  description = "Additional tags applied to SQS resources"
  type        = map(string)
  default     = {}
}

variable "visibility_timeout_seconds" {
  description = "Default SQS visibility timeout in seconds"
  type        = number
  default     = 30
}

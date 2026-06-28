variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "force_destroy" {
  description = "Allow bucket deletion when objects remain. Enabled in dev by default."
  type        = bool
  default     = null
}

variable "kms_key_arn" {
  description = "KMS key ARN for bucket encryption. Uses SSE-S3 when empty."
  type        = string
  default     = ""
}

variable "lifecycle_glacier_transition_days" {
  description = "Days before objects transition to Glacier storage class"
  type        = number
  default     = null
}

variable "project_name" {
  description = "Project name used for bucket naming and tags"
  type        = string
  default     = "polaris"
}

variable "tags" {
  description = "Additional tags applied to S3 buckets"
  type        = map(string)
  default     = {}
}

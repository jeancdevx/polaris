variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "enable_rds_rotation" {
  description = "Enable automatic rotation for the RDS master user secret"
  type        = bool
  default     = null
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "rds_master_secret_arn" {
  description = "Secrets Manager ARN for the Aurora master user password"
  type        = string
}

variable "rds_rotation_days" {
  description = "Days between automatic RDS credential rotations"
  type        = number
  default     = null
}

variable "rotate_immediately" {
  description = "Run an initial rotation when the schedule is created. Disabled in dev by default."
  type        = bool
  default     = null
}

variable "rotation_lambda_role_arn" {
  description = "IAM role ARN reserved for custom secret rotation Lambdas from the IAM module"
  type        = string
  default     = ""
}

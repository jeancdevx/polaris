variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS CLI profile to use (SSO profile name)"
  type        = string
  default     = "your-sso-profile"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "polaris"
}

variable "environment" {
  description = "Environment name (bootstrap, dev, staging, prod)"
  type        = string
  default     = "bootstrap"
}

variable "state_bucket_name_override" {
  description = "Optional: override the auto-generated bucket name. Must be globally unique."
  type        = string
  default     = ""
}

variable "enable_versioning" {
  description = "Enable versioning on the S3 state bucket"
  type        = bool
  default     = true
}

variable "enable_lifecycle_rules" {
  description = "Enable lifecycle rules for old state versions"
  type        = bool
  default     = true
}

variable "lifecycle_noncurrent_days" {
  description = "Number of days to keep noncurrent state versions"
  type        = number
  default     = 90
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

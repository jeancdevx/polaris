variable "create_oidc_provider" {
  description = "Create the GitHub OIDC provider (one per AWS account)"
  type        = bool
  default     = false
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "github_environment" {
  description = "GitHub environment allowed to assume the apply role"
  type        = string
  default     = ""
}

variable "github_repository" {
  description = "GitHub repository in owner/name format"
  type        = string

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository must be in owner/name format."
  }
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "polaris"
}

variable "state_bucket_name" {
  description = "S3 bucket that stores Terraform remote state"
  type        = string
}

variable "state_key_prefix" {
  description = "Optional key prefix inside the state bucket (e.g. env/dev/)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags applied to IAM resources"
  type        = map(string)
  default     = {}
}

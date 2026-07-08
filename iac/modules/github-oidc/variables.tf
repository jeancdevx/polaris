variable "create_oidc_provider" {
  description = "Create the GitHub OIDC provider (one per AWS account; set to false if it already exists)"
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

variable "github_environment" {
  description = "GitHub environment allowed to assume the deploy role (defaults to var.environment)"
  type        = string
  default     = ""
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the role, in owner/name format"
  type        = string

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository must be in owner/name format."
  }
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "tags" {
  description = "Additional tags applied to IAM resources"
  type        = map(string)
  default     = {}
}

variable "assets_bucket_arn" {
  description = "S3 assets bucket ARN for web-admin static deploy (empty skips S3 permissions)"
  type        = string
  default     = ""
}

variable "web_admin_s3_prefix" {
  description = "S3 prefix for web-admin static files"
  type        = string
  default     = "web-admin"
}

variable "web_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for web-admin invalidation (empty skips invalidation permission)"
  type        = string
  default     = ""
}

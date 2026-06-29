variable "access_token_validity_hours" {
  description = "Access token validity in hours"
  type        = number
  default     = 1
}

variable "admin_create_user_only" {
  description = "Restrict user creation to administrators (Flujo 20)"
  type        = bool
  default     = true
}

variable "create_user_pool_domain" {
  description = "Create a Cognito hosted UI domain prefix"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable Cognito user pool deletion protection"
  type        = bool
  default     = null
}

variable "domain_prefix" {
  description = "Globally unique Cognito domain prefix when create_user_pool_domain is true"
  type        = string
  default     = null
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "id_token_validity_hours" {
  description = "ID token validity in hours"
  type        = number
  default     = 1
}

variable "mfa_configuration" {
  description = "MFA configuration: OFF, ON, or OPTIONAL. Null uses module default per environment."
  type        = string
  default     = null

  validation {
    condition     = var.mfa_configuration == null ? true : contains(["OFF", "ON", "OPTIONAL"], var.mfa_configuration)
    error_message = "mfa_configuration must be OFF, ON, or OPTIONAL."
  }
}

variable "password_minimum_length" {
  description = "Minimum password length for user pool accounts"
  type        = number
  default     = 12
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "refresh_token_validity_days" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Additional tags applied to Cognito resources"
  type        = map(string)
  default     = {}
}

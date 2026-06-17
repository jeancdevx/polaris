variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "password_minimum_length" {
  description = "Minimum length of passwords"
  type        = number
  default     = 8
}

variable "password_require_lowercase" {
  description = "Require lowercase letters in passwords"
  type        = bool
  default     = true
}

variable "password_require_uppercase" {
  description = "Require uppercase letters in passwords"
  type        = bool
  default     = true
}

variable "password_require_numbers" {
  description = "Require numbers in passwords"
  type        = bool
  default     = true
}

variable "password_require_symbols" {
  description = "Require symbols in passwords"
  type        = bool
  default     = false
}

variable "mfa_configuration" {
  description = "MFA configuration (OFF, OPTIONAL, ON)"
  type        = string
  default     = "OFF"
  validation {
    condition     = contains(["OFF", "OPTIONAL", "ON"], var.mfa_configuration)
    error_message = "mfa_configuration must be OFF, OPTIONAL, or ON"
  }
}

variable "auto_verified_attributes" {
  description = "Attributes to auto-verify"
  type        = list(string)
  default     = ["email"]
}

variable "callback_urls" {
  description = "Allowed callback URLs for the app client"
  type        = list(string)
  default     = []
}

variable "logout_urls" {
  description = "Allowed logout URLs for the app client"
  type        = list(string)
  default     = []
}

variable "default_redirect_url" {
  description = "Default redirect URL for the app client"
  type        = string
  default     = "https://localhost:3000/callback"
}

variable "access_token_validity" {
  description = "Access token validity in hours"
  type        = number
  default     = 1
}

variable "id_token_validity" {
  description = "ID token validity in hours"
  type        = number
  default     = 1
}

variable "refresh_token_validity" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "alb_listener_arn" {
  description = "ARN of the ALB HTTP listener for VPC Link integration"
  type        = string
}

variable "api_name" {
  description = "Override for the admin HTTP API name"
  type        = string
  default     = null
}

variable "cognito_app_client_id" {
  description = "Cognito app client ID (JWT audience for admin routes)"
  type        = string
}

variable "cognito_issuer_url" {
  description = "Cognito OIDC issuer URL for the JWT authorizer"
  type        = string
}

variable "cors_allow_origins" {
  description = "Allowed origins for CORS. Empty disables the CORS configuration."
  type        = list(string)
  default     = []
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "disable_execute_api_endpoint" {
  description = "Disable the default execute-api URL. Set true in staging/prod when edge CloudFront is the only public entrypoint."
  type        = bool
  default     = false
}

variable "stage_throttling_burst_limit" {
  description = "Stage burst limit. Must be > 0; provider default 0 blocks all traffic (429)."
  type        = number
  default     = 5000
}

variable "stage_throttling_rate_limit" {
  description = "Stage steady-state rate limit (req/s). Must be > 0; provider default 0 blocks all traffic."
  type        = number
  default     = 10000
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "tags" {
  description = "Additional tags applied to private API Gateway resources"
  type        = map(string)
  default     = {}
}

variable "vpc_link_id" {
  description = "API Gateway v2 VPC link ID shared with the public HTTP API"
  type        = string
}

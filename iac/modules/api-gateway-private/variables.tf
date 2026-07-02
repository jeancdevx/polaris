variable "alb_listener_arn" {
  description = "ARN of the ALB HTTP listener for VPC Link integration"
  type        = string
}

variable "api_name" {
  description = "Override for the private HTTP API name"
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

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "execute_api_vpc_endpoint_id" {
  description = "Interface VPC endpoint ID for com.amazonaws.<region>.execute-api"
  type        = string
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

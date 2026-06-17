variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for private API Gateway"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block for VPC Endpoint security group"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for VPC Link"
  type        = list(string)
}

variable "alb_arn" {
  description = "ARN of the ALB for API integration"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the ALB"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool for authorization"
  type        = string
  default     = ""
}

variable "throttling_burst_limit" {
  description = "Throttling burst limit for API Gateway"
  type        = number
  default     = 100
}

variable "throttling_rate_limit" {
  description = "Throttling rate limit for API Gateway"
  type        = number
  default     = 50
}

variable "vpc_link_security_group_id" {
  description = "Security group ID for API Gateway VPC Link"
  type        = string
}

variable "vpc_endpoint_id" {
  description = "VPC Endpoint ID for private API Gateway"
  type        = string
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "aws_profile" {
  description = "AWS CLI profile to use (SSO profile name)"
  type        = string
  default     = "default"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "polaris"
}

variable "single_nat_gateway" {
  description = "Use one shared NAT gateway (cost saving for dev)"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags applied to all resources"
  type        = map(string)
  default     = {}
}

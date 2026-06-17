variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where security groups will be created"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block for internal traffic"
  type        = string
}

variable "kafka_ui_security_group_id" {
  description = "Security group ID of Kafka UI task - allows MSK access"
  type        = string
}

variable "lambda_functions" {
  description = "Map of Lambda functions that need security groups"
  type = map(object({
    function_name = string
    vpc_enabled   = optional(bool, true)
  }))
  default = {}
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

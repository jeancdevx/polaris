variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where Lambda will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for Lambda VPC config"
  type        = list(string)
}

variable "functions" {
  description = "Map of Lambda functions to create"
  type = map(object({
    function_name    = string
    description      = optional(string, "")
    runtime          = string
    handler          = string
    timeout          = optional(number, 30)
    memory_size      = optional(number, 128)
    source_dir       = string
    environment_vars = optional(map(string), {})
    secrets          = optional(map(string), {})
    vpc_enabled      = optional(bool, true)
    kafka_enabled    = optional(bool, false)
    kafka_topic_arns = optional(list(string), [])
    dynamodb_enabled = optional(bool, false)
    s3_enabled       = optional(bool, false)
    s3_bucket_arns   = optional(list(string), [])
    sns_enabled      = optional(bool, false)
    sns_topic_arns   = optional(list(string), [])
  }))
  default = {}
}

variable "role_arns" {
  description = "Map of IAM role ARNs for Lambda functions"
  type        = map(string)
}

variable "security_group_ids" {
  description = "Map of security group IDs for VPC-enabled Lambda functions"
  type        = map(string)
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

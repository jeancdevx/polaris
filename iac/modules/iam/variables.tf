variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "kafka_cluster_arn" {
  description = "ARN of the MSK Kafka cluster"
  type        = string
}

variable "kafka_cluster_name" {
  description = "Name of the MSK Kafka cluster"
  type        = string
}

variable "lambda_functions" {
  description = "Map of Lambda functions that need IAM roles"
  type = map(object({
    function_name    = string
    vpc_enabled      = optional(bool, true)
    kafka_enabled    = optional(bool, false)
    dynamodb_enabled = optional(bool, false)
    s3_enabled       = optional(bool, false)
    s3_bucket_arns   = optional(list(string), [])
    sns_enabled      = optional(bool, false)
    sns_topic_arns   = optional(list(string), [])
    secrets          = optional(map(string), {})
  }))
  default = {}
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

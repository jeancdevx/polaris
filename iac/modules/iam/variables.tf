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

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

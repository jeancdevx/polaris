variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where Kafka UI will be deployed"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ECS tasks"
  type        = list(string)
}

variable "ecs_cluster_id" {
  description = "ECS cluster ID"
  type        = string
}

variable "task_execution_role_arn" {
  description = "ARN of the task execution IAM role"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the task IAM role"
  type        = string
}

variable "kafka_bootstrap_servers" {
  description = "Kafka bootstrap servers endpoint"
  type        = string
}

variable "kafka_cluster_name" {
  description = "Name of the Kafka cluster"
  type        = string
}

variable "container_image" {
  description = "Docker image for Kafka UI"
  type        = string
  default     = "provectuslabs/kafka-ui:v0.7.2"
}

variable "cpu" {
  description = "CPU units for Kafka UI task"
  type        = number
  default     = 512
}

variable "memory" {
  description = "Memory (MB) for Kafka UI task"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 1
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

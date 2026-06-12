variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ECS resources will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "enable_cluster" {
  description = "Whether to create an ECS cluster"
  type        = bool
  default     = true
}

variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
  default     = ""
}

variable "services" {
  description = "Map of ECS services to create"
  type = map(object({
    name              = string
    container_name    = string
    container_image   = string
    container_port    = number
    cpu               = number
    memory            = number
    desired_count     = number
    max_count         = optional(number, 4)
    min_count         = optional(number, 1)
    health_check_path = optional(string, "/health")
    health_check_type = optional(string, "http")
    environment_vars  = optional(map(string), {})
    secrets           = optional(map(string), {})
    log_group_name    = optional(string, "")
  }))
  default = {}
}

variable "enable_alb" {
  description = "Whether to create an ALB for the services"
  type        = bool
  default     = true
}

variable "alb_internal" {
  description = "Whether the ALB should be internal"
  type        = bool
  default     = true
}

variable "alb_certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener (optional)"
  type        = string
  default     = ""
}

variable "task_execution_role_arn" {
  description = "IAM role ARN for ECS task execution. If empty, one will be created."
  type        = string
  default     = ""
}

variable "enable_autoscaling" {
  description = "Whether to enable autoscaling for services"
  type        = bool
  default     = true
}

variable "autoscaling_target_cpu" {
  description = "Target CPU utilization percentage for autoscaling"
  type        = number
  default     = 70
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "alb_ingress_cidr_blocks" {
  description = "Optional CIDR blocks for direct HTTP ingress to the internal ALB (debug). Empty = only API Gateway VPC Link SG on :80."
  type        = list(string)
  default     = []
}

variable "ecs_container_ports" {
  description = "Container ports exposed by ECS services behind the load balancer"
  type        = list(number)
  default     = [3001, 3002]

  validation {
    condition     = length(var.ecs_container_ports) > 0
    error_message = "ecs_container_ports must include at least one port."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "msk_client_port" {
  description = "MSK client port for IAM SASL authentication"
  type        = number
  default     = 9098
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "rds_port" {
  description = "PostgreSQL port for Aurora RDS"
  type        = number
  default     = 5432
}

variable "redis_port" {
  description = "Redis port for ElastiCache"
  type        = number
  default     = 6379
}

variable "tags" {
  description = "Additional tags applied to all security groups"
  type        = map(string)
  default     = {}
}

variable "vpc_cidr_block" {
  description = "VPC CIDR block used for load balancer ingress from VPC Link and internal traffic"
  type        = string

  validation {
    condition     = can(cidrhost(var.vpc_cidr_block, 0))
    error_message = "vpc_cidr_block must be a valid IPv4 CIDR block."
  }
}

variable "vpc_id" {
  description = "VPC ID where security groups are created"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ElastiCache will be deployed"
  type        = string
}

variable "data_subnet_ids" {
  description = "List of data subnet IDs for ElastiCache (private, no NAT)"
  type        = list(string)
}

variable "engine_version" {
  description = "Redis engine version (serverless supports 7.0+)"
  type        = string
  default     = "7.1"
}

variable "max_data_storage_gb" {
  description = "Maximum data storage in GB for serverless cache"
  type        = number
  default     = 5
}

variable "max_ecpu_per_second" {
  description = "Maximum ECPU per second for serverless cache"
  type        = number
  default     = 1000
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit (TLS)"
  type        = bool
  default     = true
}

variable "at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots (0 = disabled)"
  type        = number
  default     = 7
}

variable "daily_snapshot_time" {
  description = "Daily time for automatic snapshot (HH:MM format)"
  type        = string
  default     = "03:00"
}

variable "allowed_security_group_ids" {
  description = "List of security group IDs allowed to connect to ElastiCache"
  type        = list(string)
  default     = []
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where Aurora will be deployed"
  type        = string
}

variable "data_subnet_ids" {
  description = "List of data subnet IDs for Aurora (private, no NAT)"
  type        = list(string)
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "parking_db"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "parking_admin"
}

variable "db_password" {
  description = "Master password for the database. Use secrets manager in production."
  type        = string
  sensitive   = true
  default     = ""
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "17.7"
}

variable "scalability_type" {
  description = "Cluster scalability type: serverless-v2, provisioned, or limitless"
  type        = string
  default     = "serverless-v2"

  validation {
    condition     = contains(["serverless-v2", "provisioned"], var.scalability_type)
    error_message = "scalability_type must be 'serverless-v2' or 'provisioned'."
  }
}

variable "serverless_min_acu" {
  description = "Minimum ACUs for Serverless v2"
  type        = number
  default     = 0.5
}

variable "serverless_max_acu" {
  description = "Maximum ACUs for Serverless v2"
  type        = number
  default     = 2
}

variable "provisioned_instance_class" {
  description = "Instance class for Provisioned mode"
  type        = string
  default     = "db.r6g.large"
}

variable "writer_count" {
  description = "Number of writer instances (1 for most cases)"
  type        = number
  default     = 1
}

variable "reader_count" {
  description = "Number of reader instances (0 for dev, 1+ for prod)"
  type        = number
  default     = 0
}

variable "storage_type" {
  description = "Aurora storage type: aurora-iopt1 (I/O-Optimized) or aurora (Standard)"
  type        = string
  default     = "aurora"

  validation {
    condition     = contains(["aurora", "aurora-iopt1"], var.storage_type)
    error_message = "storage_type must be 'aurora' (Standard) or 'aurora-iopt1' (I/O-Optimized)."
  }
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment for writer"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection on the cluster"
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "mon:04:00-mon:05:00"
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "enable_enhanced_monitoring" {
  description = "Enable Enhanced Monitoring"
  type        = bool
  default     = true
}

variable "enhanced_monitoring_interval" {
  description = "Interval in seconds for Enhanced Monitoring (0 = disabled)"
  type        = number
  default     = 60
}

variable "enable_cloudwatch_logs" {
  description = "Enable CloudWatch log exports"
  type        = bool
  default     = true
}

variable "enable_slow_log" {
  description = "Enable Redis slow log delivery to CloudWatch"
  type        = bool
  default     = true
}

variable "allowed_security_group_ids" {
  description = "List of security group IDs allowed to connect to Aurora"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to connect to Aurora"
  type        = list(string)
  default     = []
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "parameters" {
  description = "List of DB cluster parameters to override"
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string, "immediate")
  }))
  default = []
}

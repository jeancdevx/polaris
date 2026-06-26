variable "backup_retention_period" {
  description = "Days to retain automated backups. Defaults by environment when null."
  type        = number
  default     = null
}

variable "capacity_mode" {
  description = "Aurora capacity model: serverless (dev) or provisioned (staging/prod). Auto-selected when null."
  type        = string
  default     = null

  validation {
    condition     = var.capacity_mode == null ? true : contains(["serverless", "provisioned"], var.capacity_mode)
    error_message = "capacity_mode must be serverless or provisioned."
  }
}

variable "database_name" {
  description = "Initial database name in the Aurora cluster"
  type        = string
  default     = "parking_db"
}

variable "deletion_protection" {
  description = "Prevent cluster deletion. Disabled in dev by default."
  type        = bool
  default     = null
}

variable "enabled_cloudwatch_logs_exports" {
  description = "PostgreSQL log types exported to CloudWatch Logs"
  type        = list(string)
  default     = ["postgresql"]
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "18.3"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "kms_key_arn" {
  description = "KMS key ARN for storage encryption. Uses AWS managed RDS key when empty."
  type        = string
  default     = ""
}

variable "master_username" {
  description = "Master database username"
  type        = string
  default     = "parking_admin"
}

variable "monitoring_interval" {
  description = "Enhanced monitoring interval in seconds (0 disables)"
  type        = number
  default     = 60
}

variable "monitoring_role_arn" {
  description = "IAM role ARN for Aurora enhanced monitoring"
  type        = string
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights. Disabled in dev by default."
  type        = bool
  default     = null
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "reader_count" {
  description = "Number of Aurora read replicas. Zero for serverless dev; 1 staging; 2 prod by default."
  type        = number
  default     = null

  validation {
    condition     = var.reader_count == null ? true : var.reader_count >= 0 && var.reader_count <= 5
    error_message = "reader_count must be between 0 and 5."
  }
}

variable "reader_instance_class" {
  description = "Instance class for read replicas in provisioned mode"
  type        = string
  default     = null
}

variable "serverless_max_capacity" {
  description = "Maximum Aurora Serverless v2 capacity in ACUs"
  type        = number
  default     = 2
}

variable "serverless_min_capacity" {
  description = "Minimum Aurora Serverless v2 capacity in ACUs"
  type        = number
  default     = 0.5
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on cluster deletion. Enabled in dev by default."
  type        = bool
  default     = null
}

variable "subnet_ids" {
  description = "Subnet IDs for the Aurora DB subnet group (data tier)"
  type        = list(string)

  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "subnet_ids must include at least two subnets."
  }
}

variable "tags" {
  description = "Additional tags applied to Aurora resources"
  type        = map(string)
  default     = {}
}

variable "vpc_security_group_ids" {
  description = "Security group IDs attached to the Aurora cluster"
  type        = list(string)

  validation {
    condition     = length(var.vpc_security_group_ids) > 0
    error_message = "vpc_security_group_ids must include at least one security group."
  }
}

variable "writer_instance_class" {
  description = "Instance class for the Aurora writer in provisioned mode"
  type        = string
  default     = null
}

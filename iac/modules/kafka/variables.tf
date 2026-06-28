variable "broker_count" {
  description = "Number of MSK broker nodes across availability zones"
  type        = number
  default     = null

  validation {
    condition     = var.broker_count == null ? true : var.broker_count >= 2 && var.broker_count <= 15
    error_message = "broker_count must be between 2 and 15."
  }
}

variable "broker_instance_type" {
  description = "MSK broker instance type. Null uses module default per environment."
  type        = string
  default     = null
}

variable "broker_volume_size_gb" {
  description = "EBS volume size per broker in GB. Null uses module default per environment."
  type        = number
  default     = null
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention for MSK broker logs"
  type        = number
  default     = null
}

variable "cluster_name" {
  description = "MSK cluster name. Defaults to project-environment-kafka."
  type        = string
  default     = null
}

variable "default_num_partitions" {
  description = "Default number of partitions for auto-created topics"
  type        = number
  default     = null
}

variable "default_replication_factor" {
  description = "Default replication factor for Kafka topics"
  type        = number
  default     = null
}

variable "enhanced_monitoring" {
  description = "MSK enhanced monitoring level"
  type        = string
  default     = null

  validation {
    condition = var.enhanced_monitoring == null ? true : contains(
      ["DEFAULT", "PER_BROKER", "PER_TOPIC_PER_BROKER", "PER_TOPIC_PER_PARTITION"],
      var.enhanced_monitoring
    )
    error_message = "enhanced_monitoring must be a valid MSK monitoring level."
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

variable "kafka_version" {
  description = "Apache Kafka version for the MSK cluster"
  type        = string
  default     = "3.9.x.kraft"
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption at rest. Uses AWS managed key when empty."
  type        = string
  default     = ""
}

variable "log_retention_hours" {
  description = "Kafka log retention in hours. Null uses module default per environment."
  type        = number
  default     = null
}

variable "min_insync_replicas" {
  description = "Minimum in-sync replicas for producer acknowledgements"
  type        = number
  default     = null
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "security_group_ids" {
  description = "Security group IDs attached to MSK brokers"
  type        = list(string)

  validation {
    condition     = length(var.security_group_ids) > 0
    error_message = "security_group_ids must include at least one security group."
  }
}

variable "subnet_ids" {
  description = "Subnet IDs for MSK brokers (data tier, one broker per AZ)"
  type        = list(string)

  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "subnet_ids must include at least two subnets."
  }
}

variable "tags" {
  description = "Additional tags applied to MSK resources"
  type        = map(string)
  default     = {}
}

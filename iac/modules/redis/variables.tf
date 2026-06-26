variable "auth_token" {
  description = "AUTH token for provisioned Redis with transit encryption. Generated when null."
  type        = string
  default     = null
  sensitive   = true
}

variable "capacity_mode" {
  description = "Redis capacity model: serverless (dev) or provisioned (staging/prod). Auto-selected when null."
  type        = string
  default     = null

  validation {
    condition     = var.capacity_mode == null ? true : contains(["serverless", "provisioned"], var.capacity_mode)
    error_message = "capacity_mode must be serverless or provisioned."
  }
}

variable "engine_version" {
  description = "Redis engine version for provisioned replication groups"
  type        = string
  default     = "7.1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "major_engine_version" {
  description = "Redis major engine version for serverless caches"
  type        = string
  default     = "7"
}

variable "node_type" {
  description = "ElastiCache node type for provisioned cluster mode. Null uses module default per environment."
  type        = string
  default     = null
}

variable "num_shards" {
  description = "Number of shards in provisioned cluster mode. Null uses module default per environment."
  type        = number
  default     = null

  validation {
    condition     = var.num_shards == null ? true : var.num_shards >= 1 && var.num_shards <= 90
    error_message = "num_shards must be between 1 and 90."
  }
}

variable "port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "replicas_per_shard" {
  description = "Read replicas per shard in provisioned cluster mode"
  type        = number
  default     = null

  validation {
    condition     = var.replicas_per_shard == null ? true : var.replicas_per_shard >= 0 && var.replicas_per_shard <= 5
    error_message = "replicas_per_shard must be between 0 and 5."
  }
}

variable "security_group_ids" {
  description = "Security group IDs attached to the Redis cache"
  type        = list(string)

  validation {
    condition     = length(var.security_group_ids) > 0
    error_message = "security_group_ids must include at least one security group."
  }
}

variable "serverless_max_data_storage_gb" {
  description = "Maximum data storage in GB for serverless Redis"
  type        = number
  default     = null
}

variable "serverless_max_ecpu_per_second" {
  description = "Maximum ECPUs per second for serverless Redis"
  type        = number
  default     = null
}

variable "subnet_ids" {
  description = "Subnet IDs for the Redis cache (data tier)"
  type        = list(string)

  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "subnet_ids must include at least two subnets."
  }
}

variable "tags" {
  description = "Additional tags applied to Redis resources"
  type        = map(string)
  default     = {}
}

variable "transit_encryption_enabled" {
  description = "Enable in-transit encryption for provisioned Redis. Enabled by default outside dev serverless."
  type        = bool
  default     = null
}

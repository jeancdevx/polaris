variable "aws_region" {
  description = "AWS region where development resources are provisioned"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS shared config profile name (useful for AWS SSO)"
  type        = string
  default     = null
}

variable "project_name" {
  description = "Project identifier used in naming and tagging"
  type        = string
  default     = "polaris"
}

variable "environment" {
  description = "Environment identifier"
  type        = string
  default     = "dev"
}

# VPC
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b", "us-east-2c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
}

variable "data_subnet_cidrs" {
  description = "CIDR blocks for data subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway creation"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway instead of one per AZ"
  type        = bool
  default     = false
}

variable "enable_vpc_endpoints" {
  description = "Enable VPC endpoints for AWS services"
  type        = bool
  default     = true
}

variable "vpc_endpoint_services" {
  description = "List of AWS services to create VPC endpoints for"
  type        = list(string)
  default = [
    "s3",
    "dynamodb",
    "ecr.api",
    "ecr.dkr",
    "logs",
    "sts",
    "ssm",
    "secretsmanager",
    "kms"
  ]
}

# Aurora PostgreSQL
variable "db_password" {
  description = "Master password for the Aurora database"
  type        = string
  sensitive   = true
  default     = "ChangeMe123!"
}

variable "db_engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "17.7"
}

variable "db_scalability_type" {
  description = "Cluster scalability type: serverless-v2 or provisioned"
  type        = string
  default     = "serverless-v2"
}

variable "db_serverless_min_acu" {
  description = "Minimum ACUs for Serverless v2"
  type        = number
  default     = 0.5
}

variable "db_serverless_max_acu" {
  description = "Maximum ACUs for Serverless v2"
  type        = number
  default     = 2
}

variable "db_provisioned_instance_class" {
  description = "Instance class for Provisioned mode"
  type        = string
  default     = "db.r6g.large"
}

variable "db_writer_count" {
  description = "Number of writer instances"
  type        = number
  default     = 1
}

variable "db_reader_count" {
  description = "Number of reader instances"
  type        = number
  default     = 0
}

variable "db_storage_type" {
  description = "Aurora storage type: aurora (Standard) or aurora-iopt1 (I/O-Optimized)"
  type        = string
  default     = "aurora"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for writer"
  type        = bool
  default     = true
}

variable "db_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "db_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = true
}

variable "db_enable_performance_insights" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

# ElastiCache Redis Serverless
variable "redis_engine_version" {
  description = "Redis engine version (serverless supports 7.0+)"
  type        = string
  default     = "7.1"
}

variable "redis_max_data_storage_gb" {
  description = "Maximum data storage in GB for serverless cache"
  type        = number
  default     = 5
}

variable "redis_max_ecpu_per_second" {
  description = "Maximum ECPU per second for serverless cache"
  type        = number
  default     = 1000
}

variable "redis_transit_encryption_enabled" {
  description = "Enable encryption in transit (TLS)"
  type        = bool
  default     = true
}

variable "redis_at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "redis_snapshot_retention_limit" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 7
}

variable "redis_daily_snapshot_time" {
  description = "Daily time for automatic snapshot (HH:MM format)"
  type        = string
  default     = "03:00"
}

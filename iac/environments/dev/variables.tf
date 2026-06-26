variable "aws_profile" {
  description = "AWS CLI profile to use (SSO profile name)"
  type        = string
  default     = "default"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "polaris"
}

variable "azs" {
  description = "Availability zones for VPC subnets. Empty uses the first az_count zones in the region."
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b", "us-east-2c"]
}

variable "data_subnet_cidrs" {
  description = "CIDR blocks for data tier subnets"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]
}

variable "enable_nat_gateway" {
  description = "Create NAT gateways and route private subnets through them"
  type        = bool
  default     = true
}

variable "enable_vpc_endpoints" {
  description = "Create gateway and interface VPC endpoints"
  type        = bool
  default     = true
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private tier subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public tier subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "single_nat_gateway" {
  description = "Use one shared NAT gateway (cost saving for dev)"
  type        = bool
  default     = true
}

variable "rds_backup_retention_period" {
  description = "Aurora backup retention in days. Null uses module default per environment."
  type        = number
  default     = null
}

variable "rds_capacity_mode" {
  description = "Aurora capacity mode: serverless or provisioned. Null auto-selects from environment."
  type        = string
  default     = null

  validation {
    condition     = var.rds_capacity_mode == null ? true : contains(["serverless", "provisioned"], var.rds_capacity_mode)
    error_message = "rds_capacity_mode must be serverless or provisioned."
  }
}

variable "rds_deletion_protection" {
  description = "Enable Aurora deletion protection. Null uses module default per environment."
  type        = bool
  default     = null
}

variable "rds_engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "18.3"
}

variable "rds_reader_count" {
  description = "Number of Aurora read replicas. Null uses module default per environment."
  type        = number
  default     = null
}

variable "rds_serverless_max_capacity" {
  description = "Aurora Serverless v2 maximum capacity in ACUs"
  type        = number
  default     = 2
}

variable "rds_serverless_min_capacity" {
  description = "Aurora Serverless v2 minimum capacity in ACUs"
  type        = number
  default     = 0.5
}

variable "rds_writer_instance_class" {
  description = "Aurora writer instance class in provisioned mode. Null uses module default per environment."
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags applied to all resources"
  type        = map(string)
  default     = {}
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

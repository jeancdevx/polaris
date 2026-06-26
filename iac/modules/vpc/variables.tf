variable "availability_zones" {
  description = "Availability zones for subnet placement. Uses the first az_count zones in the region when empty."
  type        = list(string)
  default     = []
}

variable "aws_region" {
  description = "AWS region used for VPC endpoint service names"
  type        = string
}

variable "az_count" {
  description = "Number of availability zones to use when availability_zones is empty"
  type        = number
  default     = 3

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 6
    error_message = "az_count must be between 2 and 6."
  }
}

variable "data_subnet_cidrs" {
  description = "CIDR blocks for data tier subnets (RDS, Redis, MSK)"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]

  validation {
    condition     = length(var.data_subnet_cidrs) == var.az_count
    error_message = "data_subnet_cidrs length must match az_count."
  }
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "enable_vpc_endpoints" {
  description = "Create gateway and interface VPC endpoints"
  type        = bool
  default     = true
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private tier subnets (ECS, Lambda)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == var.az_count
    error_message = "private_subnet_cidrs length must match az_count."
  }
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public tier subnets (ALB, NAT)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == var.az_count
    error_message = "public_subnet_cidrs length must match az_count."
  }
}

variable "single_nat_gateway" {
  description = "Use one NAT gateway shared across AZs (recommended for dev)"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags applied to all VPC resources"
  type        = map(string)
  default     = {}
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid IPv4 CIDR block."
  }
}

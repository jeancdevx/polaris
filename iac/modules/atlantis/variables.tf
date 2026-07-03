variable "acm_certificate_arn" {
  description = "ACM certificate ARN for the Atlantis HTTPS listener (required)"
  type        = string
}

variable "cluster_arn" {
  description = "ECS cluster ARN where Atlantis runs"
  type        = string
}

variable "container_cpu" {
  description = "Fargate CPU units for Atlantis"
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Fargate memory (MiB) for Atlantis"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired Atlantis task count"
  type        = number
  default     = 1
}

variable "domain_name" {
  description = "FQDN for Atlantis (must match the ACM certificate)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "github_repository" {
  description = "GitHub repository allowlist entry (owner/name)"
  type        = string
}

variable "github_token" {
  description = "GitHub PAT or token for the Atlantis bot user"
  type        = string
  sensitive   = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention for Atlantis"
  type        = number
  default     = 30
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "polaris"
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the internet-facing ALB"
  type        = list(string)
}

variable "state_bucket_name" {
  description = "Terraform state bucket (injected into Atlantis as TF_STATE_BUCKET)"
  type        = string
}

variable "state_key" {
  description = "Terraform state object key for this environment"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "webhook_secret" {
  description = "GitHub webhook HMAC secret (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}

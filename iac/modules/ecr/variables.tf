variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "image_tag_mutability" {
  description = "Whether image tags can be overwritten (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "MUTABLE"

  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.image_tag_mutability)
    error_message = "image_tag_mutability must be MUTABLE or IMMUTABLE."
  }
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "scan_on_push" {
  description = "Scan container images on push"
  type        = bool
  default     = true
}

variable "service_name" {
  description = "Logical ECS service name used in the repository name"
  type        = string
  default     = "api-service"
}

variable "tags" {
  description = "Additional tags applied to ECR resources"
  type        = map(string)
  default     = {}
}

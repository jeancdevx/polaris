variable "cognito_user_pool_arn" {
  description = "Cognito user pool ARN for api-service task role auth permissions"
  type        = string
  default     = ""
}

variable "enable_ecs_api_service_cognito_policy" {
  description = "Attach Cognito auth permissions to the api-service ECS task role. Use this flag for count/for_each; do not derive from cognito_user_pool_arn (unknown until apply)."
  type        = bool
  default     = false
}

variable "eventbridge_bus_name" {
  description = "Custom EventBridge bus name for PutEvents IAM permissions"
  type        = string
  default     = "polaris-events"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "kms_key_arns" {
  description = "KMS key ARNs allowed for Secrets Manager decryption. Uses account keys when empty."
  type        = list(string)
  default     = []
}

variable "msk_cluster_arn" {
  description = "MSK cluster ARN. Uses project naming wildcard when empty."
  type        = string
  default     = ""
}

variable "msk_cluster_name" {
  description = "MSK cluster name for IAM resource ARNs. Defaults to project-environment-kafka."
  type        = string
  default     = null
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "secrets_manager_secret_arns" {
  description = "Secrets Manager secret ARNs for read access. Uses RDS naming patterns when empty."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags applied to IAM roles"
  type        = map(string)
  default     = {}
}

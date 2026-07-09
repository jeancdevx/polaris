variable "admin_service_container_port" {
  description = "Container port exposed by admin-service"
  type        = number
  default     = 3004
}

variable "admin_service_cpu" {
  description = "Fargate CPU units for admin-service"
  type        = number
  default     = 256
}

variable "admin_service_desired_count" {
  description = "Desired task count for admin-service"
  type        = number
  default     = 1
}

variable "admin_service_ecr_repository_url" {
  description = "ECR repository URL for admin-service"
  type        = string
}

variable "admin_service_image_tag" {
  description = "Container image tag for admin-service"
  type        = string
  default     = "latest"
}

variable "admin_service_memory" {
  description = "Fargate memory (MiB) for admin-service"
  type        = number
  default     = 512
}

variable "admin_service_name" {
  description = "Override for admin-service ECS resource names"
  type        = string
  default     = null
}

variable "alb_internal" {
  description = "Deploy an internal ALB in private subnets (required for API Gateway VPC Link)"
  type        = bool
  default     = true
}

variable "alb_logs_bucket_name" {
  description = "S3 bucket name for ALB access logs. Empty disables access logging."
  type        = string
  default     = ""
}

variable "alb_logs_prefix" {
  description = "S3 key prefix for ALB access logs (must match the S3 module bucket policy)"
  type        = string
  default     = ""
}

variable "alb_security_group_id" {
  description = "Security group ID for the application load balancer"
  type        = string
}

variable "api_service_cpu" {
  description = "Fargate CPU units for api-service"
  type        = number
  default     = 256
}

variable "api_service_desired_count" {
  description = "Desired task count for api-service"
  type        = number
  default     = 1
}

variable "api_service_image_tag" {
  description = "Container image tag for api-service"
  type        = string
  default     = "latest"
}

variable "api_service_memory" {
  description = "Fargate memory (MiB) for api-service"
  type        = number
  default     = 512
}

variable "api_service_name" {
  description = "Override for api-service ECS resource names"
  type        = string
  default     = null
}

variable "aws_region" {
  description = "AWS region for environment variables"
  type        = string
}

variable "cognito_app_client_id" {
  description = "Cognito app client ID for api-service auth"
  type        = string
}

variable "cognito_issuer_url" {
  description = "Cognito OIDC issuer URL"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito user pool ID for api-service auth"
  type        = string
}

variable "container_port" {
  description = "Container port exposed by api-service"
  type        = number
  default     = 3001
}

variable "ecr_repository_url" {
  description = "ECR repository URL for api-service"
  type        = string
}

variable "ecs_admin_service_task_role_arn" {
  description = "IAM task role ARN for admin-service"
  type        = string
}

variable "ecs_api_service_task_role_arn" {
  description = "IAM task role ARN for api-service"
  type        = string
}

variable "ecs_reservation_service_task_role_arn" {
  description = "IAM task role ARN for reservation-service"
  type        = string
}

variable "ecs_event_processor_task_role_arn" {
  description = "IAM task role ARN for event-processor-service"
  type        = string
}

variable "ecs_security_group_id" {
  description = "Security group ID for ECS Fargate tasks"
  type        = string
}

variable "ecs_task_execution_role_arn" {
  description = "IAM execution role ARN for ECS Fargate tasks"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable ALB deletion protection"
  type        = bool
  default     = false
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "event_processor_service_container_port" {
  description = "Container port exposed by event-processor-service"
  type        = number
  default     = 3003
}

variable "event_processor_service_cpu" {
  description = "Fargate CPU units for event-processor-service"
  type        = number
  default     = 256
}

variable "event_processor_service_desired_count" {
  description = "Desired task count for event-processor-service"
  type        = number
  default     = 1
}

variable "event_processor_service_ecr_repository_url" {
  description = "ECR repository URL for event-processor-service"
  type        = string
}

variable "event_processor_service_image_tag" {
  description = "Container image tag for event-processor-service"
  type        = string
  default     = "latest"
}

variable "event_processor_service_memory" {
  description = "Fargate memory (MiB) for event-processor-service"
  type        = number
  default     = 512
}

variable "event_processor_service_name" {
  description = "Override for event-processor-service ECS resource names"
  type        = string
  default     = null
}

variable "eventbridge_bus_name" {
  description = "Custom EventBridge bus name for processed parking events"
  type        = string
  default     = "polaris-events"
}

variable "iot_data_endpoint" {
  description = "AWS IoT Core ATS data endpoint for LED MQTT commands"
  type        = string
  default     = ""
}

variable "led_commands_enabled" {
  description = "When true, event-processor-service publishes LED commands to IoT Core"
  type        = bool
  default     = false
}

variable "health_check_path" {
  description = "HTTP path for target group health checks"
  type        = string
  default     = "/health"
}

variable "kafka_bootstrap_brokers_sasl_iam" {
  description = "MSK bootstrap brokers for IAM SASL clients"
  type        = string
  sensitive   = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days for ECS tasks"
  type        = number
  default     = 14
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the application load balancer"
  type        = list(string)
}

variable "rds_cluster_endpoint" {
  description = "Aurora cluster writer endpoint hostname"
  type        = string
}

variable "rds_cluster_port" {
  description = "Aurora cluster port"
  type        = number
  default     = 5432
}

variable "rds_database_name" {
  description = "Aurora database name"
  type        = string
}

variable "rds_master_user_secret_arn" {
  description = "Secrets Manager ARN for Aurora master credentials"
  type        = string
}

variable "redis_url" {
  description = "Redis connection URL for api-service"
  type        = string
  sensitive   = true
}

variable "rfid_validations_table_name" {
  description = "DynamoDB RFIDValidations table name for admin-service"
  type        = string
}

variable "reservation_service_container_port" {
  description = "Container port exposed by reservation-service"
  type        = number
  default     = 3002
}

variable "reservation_service_cpu" {
  description = "Fargate CPU units for reservation-service"
  type        = number
  default     = 256
}

variable "reservation_service_desired_count" {
  description = "Desired task count for reservation-service"
  type        = number
  default     = 2
}

variable "reservation_service_ecr_repository_url" {
  description = "ECR repository URL for reservation-service"
  type        = string
}

variable "reservation_service_image_tag" {
  description = "Container image tag for reservation-service"
  type        = string
  default     = "latest"
}

variable "reservation_service_memory" {
  description = "Fargate memory (MiB) for reservation-service"
  type        = number
  default     = 512
}

variable "reservation_service_name" {
  description = "Override for reservation-service ECS resource names"
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags applied to ECS resources"
  type        = map(string)
  default     = {}
}

variable "bootstrap_admin_email" {
  description = "Email for the initial Cognito admin user created by db-bootstrap"
  type        = string
  default     = "admin@polaris.local"
}

variable "bootstrap_admin_password" {
  description = "Initial admin password for db-bootstrap. Random when null."
  type        = string
  sensitive   = true
  default     = null
}

variable "bootstrap_admin_user_id" {
  description = "Polaris user ID for the initial admin user"
  type        = string
  default     = "usr-admin01"
}

variable "db_bootstrap_cpu" {
  description = "Fargate CPU units for db-bootstrap one-shot tasks"
  type        = number
  default     = 256
}

variable "db_bootstrap_ecr_repository_url" {
  description = "ECR repository URL for db-bootstrap"
  type        = string
}

variable "db_bootstrap_image_tag" {
  description = "Container image tag for db-bootstrap"
  type        = string
  default     = "latest"
}

variable "db_bootstrap_memory" {
  description = "Fargate memory (MiB) for db-bootstrap one-shot tasks"
  type        = number
  default     = 512
}

variable "db_bootstrap_name" {
  description = "Override for db-bootstrap ECS task definition family"
  type        = string
  default     = null
}

variable "ecs_db_bootstrap_task_role_arn" {
  description = "IAM task role ARN for db-bootstrap"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the load balancer and target group"
  type        = string
}

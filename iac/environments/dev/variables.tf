variable "alb_logs_prefix" {
  description = "S3 key prefix for ALB access logs (shared with the S3 module bucket policy)"
  type        = string
  default     = "api-service"
}

variable "alb_ingress_cidr_blocks" {
  description = "Optional CIDR ingress to internal ALB for debug (curl from VPC). Empty = VPC Link only."
  type        = list(string)
  default     = []
}

variable "admin_service_cpu" {
  description = "Fargate CPU units for admin-service"
  type        = number
  default     = 256
}

variable "admin_service_desired_count" {
  description = "Desired ECS task count for admin-service"
  type        = number
  default     = 1
}

variable "admin_service_image_tag" {
  description = "ECR image tag deployed for admin-service"
  type        = string
  default     = "latest"
}

variable "admin_service_memory" {
  description = "Fargate memory (MiB) for admin-service"
  type        = number
  default     = 512
}

variable "api_service_cpu" {
  description = "Fargate CPU units for api-service"
  type        = number
  default     = 256
}

variable "api_service_desired_count" {
  description = "Desired ECS task count for api-service"
  type        = number
  default     = 1
}

variable "api_service_image_tag" {
  description = "ECR image tag deployed for api-service"
  type        = string
  default     = "latest"
}

variable "api_service_memory" {
  description = "Fargate memory (MiB) for api-service"
  type        = number
  default     = 512
}

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

variable "ecs_enable_deletion_protection" {
  description = "Enable ALB deletion protection for the ECS load balancer"
  type        = bool
  default     = false
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

variable "cognito_access_token_validity_hours" {
  description = "Cognito access token validity in hours"
  type        = number
  default     = 1
}

variable "cognito_admin_create_user_only" {
  description = "Restrict Cognito sign-up to administrators (Flujo 20 — alta solo por admin)"
  type        = bool
  default     = true
}

variable "cognito_create_user_pool_domain" {
  description = "Create a Cognito hosted UI domain"
  type        = bool
  default     = false
}

variable "cognito_deletion_protection" {
  description = "Enable Cognito user pool deletion protection. Null uses module default per environment."
  type        = bool
  default     = null
}

variable "cognito_domain_prefix" {
  description = "Globally unique Cognito domain prefix when hosted UI domain is enabled"
  type        = string
  default     = null
}

variable "cognito_id_token_validity_hours" {
  description = "Cognito ID token validity in hours"
  type        = number
  default     = 1
}

variable "cognito_mfa_configuration" {
  description = "Cognito MFA setting: OFF, ON, or OPTIONAL. Null uses module default per environment."
  type        = string
  default     = null

  validation {
    condition     = var.cognito_mfa_configuration == null ? true : contains(["OFF", "ON", "OPTIONAL"], var.cognito_mfa_configuration)
    error_message = "cognito_mfa_configuration must be OFF, ON, or OPTIONAL."
  }
}

variable "cognito_password_minimum_length" {
  description = "Minimum password length for Cognito users"
  type        = number
  default     = 12
}

variable "cognito_refresh_token_validity_days" {
  description = "Cognito refresh token validity in days"
  type        = number
  default     = 30
}

variable "dynamodb_autoscaling_max_read_capacity" {
  description = "DynamoDB autoscaling max read capacity. Null uses module default per environment."
  type        = number
  default     = null
}

variable "dynamodb_autoscaling_max_write_capacity" {
  description = "DynamoDB autoscaling max write capacity. Null uses module default per environment."
  type        = number
  default     = null
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode: PAY_PER_REQUEST or PROVISIONED. Null auto-selects from environment."
  type        = string
  default     = null

  validation {
    condition     = var.dynamodb_billing_mode == null ? true : contains(["PAY_PER_REQUEST", "PROVISIONED"], var.dynamodb_billing_mode)
    error_message = "dynamodb_billing_mode must be PAY_PER_REQUEST or PROVISIONED."
  }
}

variable "dynamodb_deletion_protection_enabled" {
  description = "Enable DynamoDB deletion protection. Null uses module default per environment."
  type        = bool
  default     = null
}

variable "dynamodb_point_in_time_recovery_enabled" {
  description = "Enable DynamoDB point-in-time recovery. Null uses module default per environment."
  type        = bool
  default     = null
}

variable "dynamodb_read_capacity" {
  description = "DynamoDB initial read capacity per table in provisioned mode"
  type        = number
  default     = null
}

variable "dynamodb_sensor_readings_ttl_enabled" {
  description = "Enable TTL on SensorReadings table"
  type        = bool
  default     = true
}

variable "dynamodb_websocket_connections_ttl_enabled" {
  description = "Enable TTL on WebSocketConnections table"
  type        = bool
  default     = true
}

variable "dynamodb_write_capacity" {
  description = "DynamoDB initial write capacity per table in provisioned mode"
  type        = number
  default     = null
}

variable "kafka_broker_count" {
  description = "Number of MSK broker nodes. Null uses module default."
  type        = number
  default     = null
}

variable "kafka_broker_instance_type" {
  description = "MSK broker instance type. Null uses module default per environment."
  type        = string
  default     = null
}

variable "kafka_broker_volume_size_gb" {
  description = "EBS volume size per MSK broker in GB. Null uses module default."
  type        = number
  default     = null
}

variable "kafka_default_num_partitions" {
  description = "Default Kafka topic partition count"
  type        = number
  default     = null
}

variable "kafka_default_replication_factor" {
  description = "Default Kafka topic replication factor"
  type        = number
  default     = null
}

variable "kafka_log_retention_hours" {
  description = "Kafka log retention in hours. Null uses module default per environment."
  type        = number
  default     = null
}

variable "kafka_min_insync_replicas" {
  description = "Kafka min.insync.replicas setting"
  type        = number
  default     = null
}

variable "kafka_topic_creator_invoke_on_deploy" {
  description = "Invoke kafka-topic-creator Lambda after deploy to ensure MSK topics exist"
  type        = bool
  default     = true
}

variable "kafka_version" {
  description = "Apache Kafka version for MSK"
  type        = string
  default     = "3.9.x.kraft"
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

variable "redis_capacity_mode" {
  description = "Redis capacity mode: serverless or provisioned. Null auto-selects from environment."
  type        = string
  default     = null

  validation {
    condition     = var.redis_capacity_mode == null ? true : contains(["serverless", "provisioned"], var.redis_capacity_mode)
    error_message = "redis_capacity_mode must be serverless or provisioned."
  }
}

variable "redis_engine_version" {
  description = "Redis engine version for provisioned replication groups"
  type        = string
  default     = "7.1"
}

variable "redis_major_engine_version" {
  description = "Redis major engine version for serverless caches"
  type        = string
  default     = "7"
}

variable "redis_node_type" {
  description = "ElastiCache node type in provisioned mode. Null uses module default per environment."
  type        = string
  default     = null
}

variable "redis_num_shards" {
  description = "Number of Redis shards in provisioned cluster mode. Null uses module default per environment."
  type        = number
  default     = null
}

variable "redis_replicas_per_shard" {
  description = "Read replicas per Redis shard in provisioned mode. Null uses module default."
  type        = number
  default     = null
}

variable "redis_serverless_max_data_storage_gb" {
  description = "Maximum data storage in GB for serverless Redis"
  type        = number
  default     = 10
}

variable "redis_serverless_max_ecpu_per_second" {
  description = "Maximum ECPUs per second for serverless Redis"
  type        = number
  default     = 5000
}

variable "redis_transit_encryption_enabled" {
  description = "Enable transit encryption for provisioned Redis. Null uses module default per environment."
  type        = bool
  default     = null
}

variable "reservation_service_cpu" {
  description = "Fargate CPU units for reservation-service"
  type        = number
  default     = 256
}

variable "reservation_service_desired_count" {
  description = "Desired ECS task count for reservation-service"
  type        = number
  default     = 2
}

variable "reservation_service_image_tag" {
  description = "ECR image tag deployed for reservation-service"
  type        = string
  default     = "latest"
}

variable "reservation_service_memory" {
  description = "Fargate memory (MiB) for reservation-service"
  type        = number
  default     = 512
}

variable "event_processor_service_cpu" {
  description = "Fargate CPU units for event-processor-service"
  type        = number
  default     = 256
}

variable "event_processor_service_desired_count" {
  description = "Desired ECS task count for event-processor-service"
  type        = number
  default     = 1
}

variable "event_processor_service_image_tag" {
  description = "ECR image tag deployed for event-processor-service"
  type        = string
  default     = "latest"
}

variable "event_processor_service_memory" {
  description = "Fargate memory (MiB) for event-processor-service"
  type        = number
  default     = 512
}

variable "s3_force_destroy" {
  description = "Allow S3 bucket deletion when objects remain. Null enables in dev only."
  type        = bool
  default     = null
}

variable "s3_kms_key_arn" {
  description = "KMS key ARN for S3 bucket encryption. Empty uses SSE-S3."
  type        = string
  default     = ""
}

variable "s3_lifecycle_glacier_transition_days" {
  description = "Days before S3 objects transition to Glacier storage class"
  type        = number
  default     = null
}

variable "secrets_manager_enable_rds_rotation" {
  description = "Enable automatic rotation for the Aurora master user secret"
  type        = bool
  default     = null
}

variable "secrets_manager_rds_rotation_days" {
  description = "Days between automatic RDS credential rotations"
  type        = number
  default     = null
}

variable "secrets_manager_rotate_immediately" {
  description = "Run an initial RDS secret rotation when the schedule is created"
  type        = bool
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

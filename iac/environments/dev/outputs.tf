output "dynamodb_table_names" {
  description = "DynamoDB table names by logical key"
  value       = module.dynamodb.table_names
}

output "s3_bucket_names" {
  description = "S3 bucket names by logical key"
  value       = module.s3.bucket_names
}

output "s3_bucket_arns" {
  description = "S3 bucket ARNs by logical key"
  value       = module.s3.bucket_arns
}

output "rds_rotation_id" {
  description = "Secrets Manager rotation schedule ID for the Aurora master user secret"
  value       = module.secrets_manager.rds_rotation_id
}

output "api_service_alb_dns_name" {
  description = "DNS name of the api-service application load balancer"
  value       = module.ecs.alb_dns_name
}

output "api_service_ecr_repository_url" {
  description = "ECR repository URL for api-service"
  value       = module.ecr.repository_url
}

output "api_service_ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "cognito_app_client_id" {
  description = "Cognito app client ID"
  value       = module.cognito.app_client_id
}

output "cognito_issuer_url" {
  description = "Cognito OIDC issuer URL for JWT validation"
  value       = module.cognito.issuer_url
}

output "cognito_jwks_uri" {
  description = "Cognito JWKS URI for JWT validation"
  value       = module.cognito.jwks_uri
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID"
  value       = module.cognito.user_pool_id
}

output "ecs_api_service_task_role_arn" {
  description = "IAM task role ARN for api-service ECS tasks"
  value       = module.iam.ecs_api_service_task_role_arn
}

output "ecs_task_execution_role_arn" {
  description = "IAM execution role ARN for ECS Fargate tasks"
  value       = module.iam.ecs_task_execution_role_arn
}

output "kafka_bootstrap_brokers_sasl_iam" {
  description = "MSK bootstrap brokers for IAM SASL clients"
  value       = module.kafka.bootstrap_brokers_sasl_iam
}

output "kafka_cluster_arn" {
  description = "MSK cluster ARN"
  value       = module.kafka.cluster_arn
}

output "msk_security_group_id" {
  description = "Amazon MSK security group ID"
  value       = module.security_groups.msk_security_group_id
}

output "rds_security_group_id" {
  description = "Aurora PostgreSQL security group ID"
  value       = module.security_groups.rds_security_group_id
}

output "redis_security_group_id" {
  description = "ElastiCache Redis security group ID"
  value       = module.security_groups.redis_security_group_id
}

output "security_group_ids" {
  description = "Map of security group names to IDs"
  value       = module.security_groups.security_group_ids
}

output "redis_configuration_endpoint" {
  description = "Redis configuration or primary endpoint"
  value       = module.redis.configuration_endpoint
}

output "redis_url" {
  description = "Redis connection URL for VPC clients"
  value       = module.redis.redis_url
  sensitive   = true
}

output "rds_cluster_endpoint" {
  description = "Aurora PostgreSQL writer endpoint"
  value       = module.rds.cluster_endpoint
}

output "rds_master_user_secret_arn" {
  description = "Secrets Manager ARN for Aurora master credentials"
  value       = module.rds.master_user_secret_arn
  sensitive   = true
}

output "kafka_msk_smoke_function_arn" {
  description = "ARN of the kafka-msk-smoke Lambda function"
  value       = module.kafka_msk_smoke.function_arn
}

output "kafka_msk_smoke_function_name" {
  description = "Name of the kafka-msk-smoke Lambda function"
  value       = module.kafka_msk_smoke.function_name
}

output "kafka_msk_smoke_role_arn" {
  description = "IAM role ARN for kafka-msk-smoke Lambda"
  value       = module.iam.kafka_msk_smoke_role_arn
}

output "kafka_topic_creator_function_arn" {
  description = "ARN of the kafka-topic-creator Lambda function"
  value       = module.kafka_topic_creator.function_arn
}

output "kafka_topic_creator_function_name" {
  description = "Name of the kafka-topic-creator Lambda function"
  value       = module.kafka_topic_creator.function_name
}

output "kafka_topic_creator_role_arn" {
  description = "IAM role ARN for kafka-topic-creator Lambda"
  value       = module.iam.kafka_topic_creator_role_arn
}

output "msk_client_role_arn" {
  description = "IAM role ARN for MSK IAM SASL clients"
  value       = module.iam.msk_client_role_arn
}

output "rds_enhanced_monitoring_role_arn" {
  description = "IAM role ARN for Aurora enhanced monitoring"
  value       = module.iam.rds_enhanced_monitoring_role_arn
}

output "secrets_rotation_role_arn" {
  description = "IAM role ARN for Secrets Manager RDS rotation"
  value       = module.iam.secrets_rotation_role_arn
}

output "availability_zones" {
  description = "Availability zones used by the VPC"
  value       = module.vpc.availability_zones
}

output "data_subnet_ids" {
  description = "Data tier subnet IDs"
  value       = module.vpc.data_subnet_ids
}

output "private_subnet_ids" {
  description = "Private tier subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public tier subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

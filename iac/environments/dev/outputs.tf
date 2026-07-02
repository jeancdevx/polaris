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

output "api_gateway_private_smoke_function_arn" {
  description = "ARN of the api-gateway-private-smoke Lambda function"
  value       = module.api_gateway_private_smoke.function_arn
}

output "api_gateway_private_smoke_function_name" {
  description = "Name of the api-gateway-private-smoke Lambda function"
  value       = module.api_gateway_private_smoke.function_name
}

output "appsync_api_key" {
  description = "AppSync API key for smoke tests"
  value       = module.appsync.api_key
  sensitive   = true
}

output "appsync_availability_function_arn" {
  description = "ARN of the appsync-availability Lambda function"
  value       = module.appsync_availability.function_arn
}

output "appsync_availability_function_name" {
  description = "Name of the appsync-availability Lambda function"
  value       = module.appsync_availability.function_name
}

output "appsync_graphql_endpoint" {
  description = "AppSync GraphQL HTTPS endpoint"
  value       = module.appsync.graphql_endpoint
}

output "appsync_graphql_api_id" {
  description = "AppSync GraphQL API identifier"
  value       = module.appsync.api_id
}

output "appsync_realtime_endpoint" {
  description = "AppSync WebSocket endpoint for subscriptions"
  value       = module.appsync.realtime_endpoint
}

output "appsync_occupancy_publisher_function_arn" {
  description = "ARN of the appsync-occupancy-publisher Lambda function"
  value       = module.appsync_occupancy_publisher.function_arn
}

output "appsync_occupancy_publisher_function_name" {
  description = "Name of the appsync-occupancy-publisher Lambda function"
  value       = module.appsync_occupancy_publisher.function_name
}

output "api_gateway_private_endpoint" {
  description = "Private REST API invoke URL (VPC endpoint only)"
  value       = module.api_gateway_private.api_endpoint
}

output "admin_service_ecs_service_name" {
  description = "ECS service name for admin-service"
  value       = "${var.project_name}-${var.environment}-admin-service"
}

output "admin_service_ecr_repository_url" {
  description = "ECR repository URL for admin-service"
  value       = module.ecr_admin_service.repository_url
}

output "ecs_admin_service_task_role_arn" {
  description = "IAM task role ARN for admin-service ECS tasks"
  value       = module.iam.ecs_admin_service_task_role_arn
}

output "execute_api_vpc_endpoint_id" {
  description = "Interface VPC endpoint ID for API Gateway execute-api"
  value       = module.vpc.execute_api_vpc_endpoint_id
}

output "api_gateway_endpoint" {
  description = "Public HTTP API invoke URL for api-service"
  value       = module.api_gateway.api_endpoint
}

output "api_service_alb_dns_name" {
  description = "DNS name of the api-service application load balancer"
  value       = module.ecs.alb_dns_name
}

output "api_service_ecr_repository_url" {
  description = "ECR repository URL for api-service"
  value       = module.ecr_api_service.repository_url
}

output "reservation_service_ecr_repository_url" {
  description = "ECR repository URL for reservation-service"
  value       = module.ecr_reservation_service.repository_url
}

output "event_processor_service_ecr_repository_url" {
  description = "ECR repository URL for event-processor-service"
  value       = module.ecr_event_processor_service.repository_url
}

output "event_processor_service_ecs_service_name" {
  description = "ECS service name for event-processor-service"
  value       = module.ecs.event_processor_service_name
}

output "event_processor_service_log_group_name" {
  description = "CloudWatch log group for event-processor-service ECS tasks"
  value       = module.ecs.event_processor_service_log_group_name
}

output "reservation_service_ecs_service_name" {
  description = "ECS service name for reservation-service"
  value       = "${var.project_name}-${var.environment}-reservation-service"
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

output "ecs_reservation_service_task_role_arn" {
  description = "IAM task role ARN for reservation-service ECS tasks"
  value       = module.iam.ecs_reservation_service_task_role_arn
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

output "rfid_validator_function_arn" {
  description = "ARN of the rfid-validator Lambda function"
  value       = module.rfid_validator.function_arn
}

output "rfid_validator_function_name" {
  description = "Name of the rfid-validator Lambda function"
  value       = module.rfid_validator.function_name
}

output "rfid_validator_role_arn" {
  description = "IAM role ARN for rfid-validator Lambda"
  value       = module.iam.rfid_validator_role_arn
}

output "audit_logger_function_arn" {
  description = "ARN of the audit-logger Lambda function"
  value       = module.audit_logger.function_arn
}

output "audit_logger_function_name" {
  description = "Name of the audit-logger Lambda function"
  value       = module.audit_logger.function_name
}

output "audit_logger_role_arn" {
  description = "IAM role ARN for audit-logger Lambda"
  value       = module.iam.audit_logger_role_arn
}

output "eventbridge_bus_arn" {
  description = "ARN of the custom EventBridge bus"
  value       = module.eventbridge.bus_arn
}

output "eventbridge_bus_name" {
  description = "Name of the custom EventBridge bus"
  value       = module.eventbridge.bus_name
}

output "notification_sender_function_arn" {
  description = "ARN of the notification-sender Lambda function"
  value       = module.notification_sender.function_arn
}

output "notification_sender_function_name" {
  description = "Name of the notification-sender Lambda function"
  value       = module.notification_sender.function_name
}

output "reservation_cleanup_function_arn" {
  description = "ARN of the reservation-cleanup Lambda function"
  value       = module.reservation_cleanup.function_arn
}

output "reservation_cleanup_function_name" {
  description = "Name of the reservation-cleanup Lambda function"
  value       = module.reservation_cleanup.function_name
}

output "health_checker_function_arn" {
  description = "ARN of the health-checker Lambda function"
  value       = module.health_checker.function_arn
}

output "health_checker_function_name" {
  description = "Name of the health-checker Lambda function"
  value       = module.health_checker.function_name
}

output "sns_alerts_topic_arn" {
  description = "ARN of the operational alerts SNS topic"
  value       = module.sns.alerts_topic_arn
}

output "eventbridge_notification_sender_rule_names" {
  description = "EventBridge rule names that invoke notification-sender"
  value       = module.eventbridge.notification_sender_rule_names
}

output "eventbridge_reservation_cleanup_schedule_rule_name" {
  description = "EventBridge schedule rule for reservation-cleanup"
  value       = module.eventbridge.reservation_cleanup_schedule_rule_name
}

output "eventbridge_health_checker_schedule_rule_name" {
  description = "EventBridge schedule rule for health-checker"
  value       = module.eventbridge.health_checker_schedule_rule_name
}

output "eventbridge_audit_logger_rule_names" {
  description = "EventBridge rule names that invoke audit-logger"
  value       = module.eventbridge.audit_logger_rule_names
}

output "ecs_event_processor_task_role_arn" {
  description = "IAM task role ARN for event-processor-service ECS tasks"
  value       = module.iam.ecs_event_processor_task_role_arn
}

output "sqs_queue_names" {
  description = "SQS queue names by logical key"
  value       = module.sqs.queue_names
}

output "sqs_queue_urls" {
  description = "SQS queue URLs by logical key"
  value       = module.sqs.queue_urls
}

output "iot_data_endpoint" {
  description = "AWS IoT Core ATS data endpoint for MQTT clients"
  value       = module.iot_core.data_endpoint
}

output "iot_device_policy_name" {
  description = "IoT policy name for Polaris ESP32 devices"
  value       = module.iot_core.device_policy_name
}

output "sensor_data_processor_function_arn" {
  description = "ARN of the sensor-data-processor Lambda function"
  value       = module.sensor_data_processor.function_arn
}

output "sensor_data_processor_function_name" {
  description = "Name of the sensor-data-processor Lambda function"
  value       = module.sensor_data_processor.function_name
}

output "sensor_data_processor_role_arn" {
  description = "IAM role ARN for sensor-data-processor Lambda"
  value       = module.iam.sensor_data_processor_role_arn
}

output "iot_sensor_occupancy_rule_names" {
  description = "IoT topic rule names that invoke sensor-data-processor"
  value       = module.iot_core.sensor_occupancy_rule_names
}

output "iot_rfid_rule_names" {
  description = "IoT topic rule names that invoke rfid-validator"
  value       = module.iot_core.rfid_rule_names
}

output "iot_simulator_device_id" {
  description = "Logical device ID for the Terraform-managed IoT simulator"
  value       = module.iot_core.simulator_device_id
}

output "iot_simulator_thing_name" {
  description = "AWS IoT thing name for the device simulator"
  value       = module.iot_core.simulator_thing_name
}

output "iot_simulator_certificate_pem" {
  description = "PEM-encoded certificate for the IoT device simulator"
  value       = module.iot_core.simulator_certificate_pem
  sensitive   = true
}

output "iot_simulator_private_key" {
  description = "PEM-encoded private key for the IoT device simulator"
  value       = module.iot_core.simulator_private_key
  sensitive   = true
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

output "ecs_admin_service_task_role_arn" {
  description = "IAM task role ARN for admin-service ECS tasks"
  value       = aws_iam_role.ecs_admin_service_task.arn
}

output "ecs_admin_service_task_role_name" {
  description = "IAM task role name for admin-service ECS tasks"
  value       = aws_iam_role.ecs_admin_service_task.name
}

output "ecs_api_service_task_role_arn" {
  description = "IAM task role ARN for api-service ECS tasks"
  value       = aws_iam_role.ecs_api_service_task.arn
}

output "ecs_api_service_task_role_name" {
  description = "IAM task role name for api-service ECS tasks"
  value       = aws_iam_role.ecs_api_service_task.name
}

output "ecs_reservation_service_task_role_arn" {
  description = "IAM task role ARN for reservation-service ECS tasks"
  value       = aws_iam_role.ecs_reservation_service_task.arn
}

output "ecs_reservation_service_task_role_name" {
  description = "IAM task role name for reservation-service ECS tasks"
  value       = aws_iam_role.ecs_reservation_service_task.name
}

output "ecs_event_processor_task_role_arn" {
  description = "IAM task role ARN for event-processor-service ECS tasks"
  value       = aws_iam_role.ecs_event_processor_task.arn
}

output "ecs_event_processor_task_role_name" {
  description = "IAM task role name for event-processor-service ECS tasks"
  value       = aws_iam_role.ecs_event_processor_task.name
}

output "eventbridge_publish_policy_arn" {
  description = "IAM policy ARN for publishing events to the custom EventBridge bus"
  value       = aws_iam_policy.eventbridge_publish.arn
}

output "ecs_task_execution_role_arn" {
  description = "IAM execution role ARN for ECS Fargate tasks"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_execution_role_name" {
  description = "IAM execution role name for ECS Fargate tasks"
  value       = aws_iam_role.ecs_task_execution.name
}

output "appsync_availability_role_arn" {
  description = "IAM role ARN for the appsync-availability Lambda function"
  value       = aws_iam_role.appsync_availability.arn
}

output "appsync_occupancy_publisher_role_arn" {
  description = "IAM role ARN for the appsync-occupancy-publisher Lambda function"
  value       = aws_iam_role.appsync_occupancy_publisher.arn
}

output "appsync_occupancy_publisher_role_name" {
  description = "IAM role name for the appsync-occupancy-publisher Lambda function"
  value       = aws_iam_role.appsync_occupancy_publisher.name
}

output "api_gateway_private_smoke_role_arn" {
  description = "IAM role ARN for the api-gateway-private-smoke Lambda function"
  value       = aws_iam_role.api_gateway_private_smoke.arn
}

output "kafka_msk_smoke_role_arn" {
  description = "IAM role ARN for the kafka-msk-smoke Lambda function"
  value       = aws_iam_role.kafka_msk_smoke.arn
}

output "kafka_msk_smoke_role_name" {
  description = "IAM role name for the kafka-msk-smoke Lambda function"
  value       = aws_iam_role.kafka_msk_smoke.name
}

output "kafka_topic_creator_role_arn" {
  description = "IAM role ARN for the kafka-topic-creator Lambda function"
  value       = aws_iam_role.kafka_topic_creator.arn
}

output "kafka_topic_creator_role_name" {
  description = "IAM role name for the kafka-topic-creator Lambda function"
  value       = aws_iam_role.kafka_topic_creator.name
}

output "rfid_validator_role_arn" {
  description = "IAM role ARN for the rfid-validator Lambda function"
  value       = aws_iam_role.rfid_validator.arn
}

output "rfid_validator_role_name" {
  description = "IAM role name for the rfid-validator Lambda function"
  value       = aws_iam_role.rfid_validator.name
}

output "sensor_data_processor_role_arn" {
  description = "IAM role ARN for sensor-data-processor Lambda"
  value       = aws_iam_role.sensor_data_processor.arn
}

output "sensor_data_processor_role_name" {
  description = "IAM role name for sensor-data-processor Lambda"
  value       = aws_iam_role.sensor_data_processor.name
}

output "notification_sender_role_arn" {
  description = "IAM role ARN for the notification-sender Lambda function"
  value       = aws_iam_role.notification_sender.arn
}

output "notification_sender_role_name" {
  description = "IAM role name for the notification-sender Lambda function"
  value       = aws_iam_role.notification_sender.name
}

output "reservation_cleanup_role_arn" {
  description = "IAM role ARN for the reservation-cleanup Lambda function"
  value       = aws_iam_role.reservation_cleanup.arn
}

output "reservation_cleanup_role_name" {
  description = "IAM role name for the reservation-cleanup Lambda function"
  value       = aws_iam_role.reservation_cleanup.name
}

output "health_checker_role_arn" {
  description = "IAM role ARN for the health-checker Lambda function"
  value       = aws_iam_role.health_checker.arn
}

output "health_checker_role_name" {
  description = "IAM role name for the health-checker Lambda function"
  value       = aws_iam_role.health_checker.name
}

output "audit_logger_role_arn" {
  description = "IAM role ARN for the audit-logger Lambda function"
  value       = aws_iam_role.audit_logger.arn
}

output "audit_logger_role_name" {
  description = "IAM role name for the audit-logger Lambda function"
  value       = aws_iam_role.audit_logger.name
}

output "msk_client_policy_arn" {
  description = "IAM policy ARN for MSK IAM SASL client access"
  value       = aws_iam_policy.msk_client.arn
}

output "msk_client_role_arn" {
  description = "IAM role ARN for MSK clients (ECS tasks and Lambda)"
  value       = aws_iam_role.msk_client.arn
}

output "msk_client_role_name" {
  description = "IAM role name for MSK clients"
  value       = aws_iam_role.msk_client.name
}

output "msk_topic_admin_policy_arn" {
  description = "IAM policy ARN for MSK topic administration"
  value       = aws_iam_policy.msk_topic_admin.arn
}

output "policy_arns" {
  description = "Map of IAM policy names to ARNs"
  value = {
    audit_logger_archive            = aws_iam_policy.audit_logger_archive.arn
    audit_logger_execution          = aws_iam_policy.audit_logger_execution.arn
    kafka_msk_smoke_execution       = aws_iam_policy.kafka_msk_smoke_execution.arn
    kafka_topic_creator_execution   = aws_iam_policy.kafka_topic_creator_execution.arn
    rfid_validator_data             = aws_iam_policy.rfid_validator_data.arn
    rfid_validator_execution        = aws_iam_policy.rfid_validator_execution.arn
    health_checker_alerts           = aws_iam_policy.health_checker_alerts.arn
    health_checker_execution        = aws_iam_policy.health_checker_execution.arn
    notification_sender_execution   = aws_iam_policy.notification_sender_execution.arn
    notification_sender_notify      = aws_iam_policy.notification_sender_notify.arn
    reservation_cleanup_execution   = aws_iam_policy.reservation_cleanup_execution.arn
    sensor_data_processor_data      = aws_iam_policy.sensor_data_processor_data.arn
    sensor_data_processor_execution = aws_iam_policy.sensor_data_processor_execution.arn
    eventbridge_publish             = aws_iam_policy.eventbridge_publish.arn
    msk_client                      = aws_iam_policy.msk_client.arn
    msk_topic_admin                 = aws_iam_policy.msk_topic_admin.arn
    secrets_read                    = aws_iam_policy.secrets_read.arn
    secrets_rotation                = aws_iam_policy.secrets_rotation.arn
  }
}

output "rds_enhanced_monitoring_role_arn" {
  description = "IAM role ARN for Aurora enhanced monitoring"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}

output "rds_enhanced_monitoring_role_name" {
  description = "IAM role name for Aurora enhanced monitoring"
  value       = aws_iam_role.rds_enhanced_monitoring.name
}

output "role_arns" {
  description = "Map of IAM role names to ARNs"
  value = {
    audit_logger                 = aws_iam_role.audit_logger.arn
    health_checker               = aws_iam_role.health_checker.arn
    notification_sender          = aws_iam_role.notification_sender.arn
    reservation_cleanup          = aws_iam_role.reservation_cleanup.arn
    ecs_api_service_task         = aws_iam_role.ecs_api_service_task.arn
    ecs_event_processor_task     = aws_iam_role.ecs_event_processor_task.arn
    ecs_reservation_service_task = aws_iam_role.ecs_reservation_service_task.arn
    ecs_task_execution           = aws_iam_role.ecs_task_execution.arn
    kafka_msk_smoke              = aws_iam_role.kafka_msk_smoke.arn
    kafka_topic_creator          = aws_iam_role.kafka_topic_creator.arn
    rfid_validator               = aws_iam_role.rfid_validator.arn
    sensor_data_processor        = aws_iam_role.sensor_data_processor.arn
    msk_client                   = aws_iam_role.msk_client.arn
    rds_enhanced_monitoring      = aws_iam_role.rds_enhanced_monitoring.arn
    secrets_rotation             = aws_iam_role.secrets_rotation.arn
  }
}

output "secrets_read_policy_arn" {
  description = "IAM policy ARN for reading Secrets Manager credentials"
  value       = aws_iam_policy.secrets_read.arn
}

output "secrets_rotation_role_arn" {
  description = "IAM role ARN for Secrets Manager RDS credential rotation"
  value       = aws_iam_role.secrets_rotation.arn
}

output "secrets_rotation_role_name" {
  description = "IAM role name for Secrets Manager RDS credential rotation"
  value       = aws_iam_role.secrets_rotation.name
}

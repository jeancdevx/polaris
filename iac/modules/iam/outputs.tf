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

output "ecs_task_execution_role_arn" {
  description = "IAM execution role ARN for ECS Fargate tasks"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_execution_role_name" {
  description = "IAM execution role name for ECS Fargate tasks"
  value       = aws_iam_role.ecs_task_execution.name
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
    kafka_msk_smoke_execution     = aws_iam_policy.kafka_msk_smoke_execution.arn
    kafka_topic_creator_execution = aws_iam_policy.kafka_topic_creator_execution.arn
    rfid_validator_data           = aws_iam_policy.rfid_validator_data.arn
    rfid_validator_execution      = aws_iam_policy.rfid_validator_execution.arn
    msk_client                    = aws_iam_policy.msk_client.arn
    msk_topic_admin               = aws_iam_policy.msk_topic_admin.arn
    secrets_read                  = aws_iam_policy.secrets_read.arn
    secrets_rotation              = aws_iam_policy.secrets_rotation.arn
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
    ecs_api_service_task         = aws_iam_role.ecs_api_service_task.arn
    ecs_reservation_service_task = aws_iam_role.ecs_reservation_service_task.arn
    ecs_task_execution           = aws_iam_role.ecs_task_execution.arn
    kafka_msk_smoke              = aws_iam_role.kafka_msk_smoke.arn
    kafka_topic_creator          = aws_iam_role.kafka_topic_creator.arn
    rfid_validator               = aws_iam_role.rfid_validator.arn
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

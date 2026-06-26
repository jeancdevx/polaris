output "kafka_topic_creator_role_arn" {
  description = "IAM role ARN for the kafka-topic-creator Lambda function"
  value       = aws_iam_role.kafka_topic_creator.arn
}

output "kafka_topic_creator_role_name" {
  description = "IAM role name for the kafka-topic-creator Lambda function"
  value       = aws_iam_role.kafka_topic_creator.name
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
    kafka_topic_creator_execution = aws_iam_policy.kafka_topic_creator_execution.arn
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
    kafka_topic_creator     = aws_iam_role.kafka_topic_creator.arn
    msk_client              = aws_iam_role.msk_client.arn
    rds_enhanced_monitoring = aws_iam_role.rds_enhanced_monitoring.arn
    secrets_rotation        = aws_iam_role.secrets_rotation.arn
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

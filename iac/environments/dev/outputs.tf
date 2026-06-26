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

output "rds_cluster_endpoint" {
  description = "Aurora PostgreSQL writer endpoint"
  value       = module.rds.cluster_endpoint
}

output "rds_master_user_secret_arn" {
  description = "Secrets Manager ARN for Aurora master credentials"
  value       = module.rds.master_user_secret_arn
  sensitive   = true
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

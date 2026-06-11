output "cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.main.id
}

output "cluster_arn" {
  description = "Aurora cluster ARN"
  value       = aws_rds_cluster.main.arn
}

output "cluster_endpoint" {
  description = "Aurora cluster writer endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "db_username" {
  description = "Database master username"
  value       = aws_rds_cluster.main.master_username
}

output "writer_instance_arns" {
  description = "ARNs of writer instances"
  value       = aws_rds_cluster_instance.writer[*].arn
}

output "reader_instance_arns" {
  description = "ARNs of reader instances"
  value       = aws_rds_cluster_instance.reader[*].arn
}

output "subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_subnet_group.main.name
}

output "parameter_group_name" {
  description = "DB cluster parameter group name"
  value       = aws_rds_cluster_parameter_group.main.name
}

output "security_group_id" {
  description = "Aurora security group ID"
  value       = aws_security_group.aurora[0].id
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = aws_kms_key.aurora[0].arn
}

output "kms_key_alias" {
  description = "KMS key alias"
  value       = aws_kms_alias.aurora[0].name
}

output "capacity_mode" {
  description = "Active Aurora capacity mode (serverless or provisioned)"
  value       = local.capacity_mode
}

output "cluster_arn" {
  description = "ARN of the Aurora cluster"
  value       = aws_rds_cluster.main.arn
}

output "cluster_endpoint" {
  description = "Writer endpoint for the Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_id" {
  description = "Identifier of the Aurora cluster"
  value       = aws_rds_cluster.main.id
}

output "cluster_port" {
  description = "Port the Aurora cluster accepts connections on"
  value       = aws_rds_cluster.main.port
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint for the Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_resource_id" {
  description = "Resource ID of the Aurora cluster"
  value       = aws_rds_cluster.main.cluster_resource_id
}

output "database_name" {
  description = "Name of the default database"
  value       = aws_rds_cluster.main.database_name
}

output "instance_endpoints" {
  description = "Instance endpoints for all cluster instances"
  value = concat(
    [for instance in aws_rds_cluster_instance.serverless : instance.endpoint],
    [for instance in aws_rds_cluster_instance.writer : instance.endpoint],
    [for instance in aws_rds_cluster_instance.reader : instance.endpoint]
  )
}

output "master_user_secret_arn" {
  description = "Secrets Manager ARN for the managed master user password"
  value       = aws_rds_cluster.main.master_user_secret[0].secret_arn
}

output "reader_count" {
  description = "Number of read replica instances deployed"
  value       = local.use_serverless ? 0 : local.reader_count
}

output "subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

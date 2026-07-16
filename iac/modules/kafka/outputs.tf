output "bootstrap_brokers_sasl_iam" {
  description = "TLS bootstrap brokers for IAM SASL authentication"
  value       = aws_msk_cluster.main.bootstrap_brokers_sasl_iam
}

output "bootstrap_brokers_tls" {
  description = "TLS bootstrap broker connection string"
  value       = aws_msk_cluster.main.bootstrap_brokers_tls
}

output "broker_count" {
  description = "Number of MSK brokers used for per-broker CloudWatch alarms"
  value       = local.broker_count
}

output "cluster_arn" {
  description = "ARN of the MSK cluster"
  value       = aws_msk_cluster.main.arn
}

output "cluster_name" {
  description = "Name of the MSK cluster"
  value       = aws_msk_cluster.main.cluster_name
}

output "cluster_uuid" {
  description = "UUID of the MSK cluster"
  value       = aws_msk_cluster.main.cluster_uuid
}

output "configuration_arn" {
  description = "ARN of the MSK configuration"
  value       = aws_msk_configuration.main.arn
}

output "current_version" {
  description = "Current version of the MSK cluster"
  value       = aws_msk_cluster.main.current_version
}

output "kafka_version" {
  description = "Apache Kafka version running on the cluster"
  value       = var.kafka_version
}

output "zookeeper_connect_string" {
  description = "ZooKeeper connection string for the MSK cluster"
  value       = aws_msk_cluster.main.zookeeper_connect_string
}

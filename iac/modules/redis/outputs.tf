output "cache_name" {
  description = "Name of the serverless cache"
  value       = aws_elasticache_serverless_cache.main.name
}

output "cache_arn" {
  description = "ARN of the serverless cache"
  value       = aws_elasticache_serverless_cache.main.arn
}

output "endpoint_address" {
  description = "Endpoint address of the serverless cache"
  value       = aws_elasticache_serverless_cache.main.endpoint[0].address
}

output "endpoint_port" {
  description = "Endpoint port of the serverless cache"
  value       = aws_elasticache_serverless_cache.main.endpoint[0].port
}

output "subnet_group_name" {
  description = "Subnet group name"
  value       = aws_elasticache_subnet_group.main.name
}

output "security_group_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis[0].id
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = aws_kms_key.redis[0].arn
}

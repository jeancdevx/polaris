output "rds_master_secret_arn" {
  description = "Secrets Manager ARN for the Aurora master user password"
  value       = var.rds_master_secret_arn
}

output "rds_rotation_days" {
  description = "Configured interval in days for RDS credential rotation"
  value       = local.rds_rotation_days
}

output "rds_rotation_enabled" {
  description = "Whether automatic RDS master user secret rotation is enabled"
  value       = local.enable_rds_rotation
}

output "rds_rotation_id" {
  description = "Secrets Manager secret rotation resource ID when rotation is enabled"
  value       = try(aws_secretsmanager_secret_rotation.rds_master[0].id, null)
}

output "rotation_lambda_role_arn" {
  description = "IAM role ARN reserved for custom rotation Lambdas from the IAM module"
  value       = var.rotation_lambda_role_arn != "" ? var.rotation_lambda_role_arn : null
}

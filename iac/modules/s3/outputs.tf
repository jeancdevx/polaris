output "audit_logs_bucket_arn" {
  description = "Audit logs bucket ARN"
  value       = aws_s3_bucket.audit_logs.arn
}

output "audit_logs_bucket_name" {
  description = "Audit logs bucket name"
  value       = aws_s3_bucket.audit_logs.id
}

output "backups_bucket_arn" {
  description = "RDS backups bucket ARN"
  value       = aws_s3_bucket.backups.arn
}

output "backups_bucket_name" {
  description = "RDS backups bucket name"
  value       = aws_s3_bucket.backups.id
}

output "assets_bucket_arn" {
  description = "Static assets bucket ARN"
  value       = aws_s3_bucket.assets.arn
}

output "assets_bucket_name" {
  description = "Static assets bucket name"
  value       = aws_s3_bucket.assets.id
}

output "alb_logs_bucket_arn" {
  description = "ALB access logs bucket ARN"
  value       = aws_s3_bucket.alb_logs.arn
}

output "alb_logs_bucket_name" {
  description = "ALB access logs bucket name"
  value       = aws_s3_bucket.alb_logs.id
}

output "bucket_arns" {
  description = "Map of logical bucket keys to ARNs"
  value = {
    audit_logs = aws_s3_bucket.audit_logs.arn
    backups    = aws_s3_bucket.backups.arn
    assets     = aws_s3_bucket.assets.arn
    alb_logs   = aws_s3_bucket.alb_logs.arn
  }
}

output "bucket_names" {
  description = "Map of logical bucket keys to names"
  value = {
    audit_logs = aws_s3_bucket.audit_logs.id
    backups    = aws_s3_bucket.backups.id
    assets     = aws_s3_bucket.assets.id
    alb_logs   = aws_s3_bucket.alb_logs.id
  }
}

output "repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.service.arn
}

output "repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.service.name
}

output "repository_url" {
  description = "ECR repository URL for docker push/pull"
  value       = aws_ecr_repository.service.repository_url
}

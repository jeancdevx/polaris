output "api_endpoint" {
  description = "Private invoke URL via the execute-api VPC endpoint ($default stage)"
  value       = local.private_api_endpoint
}

output "api_id" {
  description = "Private HTTP API identifier"
  value       = aws_apigatewayv2_api.private.id
}

output "integration_id" {
  description = "ALB VPC Link integration identifier"
  value       = aws_apigatewayv2_integration.alb.id
}

output "api_endpoint" {
  description = "Default execute-api URL when disable_execute_api_endpoint is false (dev/smoke tests). Null when only the edge custom domain is used."
  value       = local.api_endpoint
}

output "api_id" {
  description = "Admin HTTP API identifier"
  value       = aws_apigatewayv2_api.private.id
}

output "api_stage_name" {
  description = "Default stage name"
  value       = aws_apigatewayv2_stage.default.name
}

output "integration_id" {
  description = "ALB VPC Link integration identifier"
  value       = aws_apigatewayv2_integration.alb.id
}

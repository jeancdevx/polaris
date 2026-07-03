output "api_endpoint" {
  description = "Public invoke URL for the HTTP API ($default stage)"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "api_id" {
  description = "HTTP API identifier"
  value       = aws_apigatewayv2_api.public.id
}

output "default_stage_arn" {
  description = "Default stage ARN for WAF association"
  value       = aws_apigatewayv2_stage.default.arn
}

output "integration_id" {
  description = "ALB VPC Link integration identifier"
  value       = aws_apigatewayv2_integration.alb.id
}

output "vpc_link_id" {
  description = "VPC link identifier for ALB integration"
  value       = aws_apigatewayv2_vpc_link.alb.id
}

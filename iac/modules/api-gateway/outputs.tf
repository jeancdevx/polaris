output "public_api_id" {
  description = "ID of the public REST API"
  value       = aws_api_gateway_rest_api.public.id
}

output "public_api_endpoint" {
  description = "Endpoint URL of the public REST API"
  value       = "${aws_api_gateway_rest_api.public.execution_arn}/${aws_api_gateway_stage.public.stage_name}"
}

output "public_api_invoke_url" {
  description = "Invoke URL of the public REST API stage"
  value       = aws_api_gateway_stage.public.invoke_url
}

output "public_api_execution_arn" {
  description = "Execution ARN of the public REST API"
  value       = aws_api_gateway_rest_api.public.execution_arn
}

output "private_api_id" {
  description = "ID of the private REST API"
  value       = aws_api_gateway_rest_api.private.id
}

output "private_api_endpoint" {
  description = "Endpoint URL of the private REST API"
  value       = "${aws_api_gateway_rest_api.private.execution_arn}/${aws_api_gateway_stage.private.stage_name}"
}

output "private_api_invoke_url" {
  description = "Invoke URL of the private REST API stage"
  value       = aws_api_gateway_stage.private.invoke_url
}

output "private_api_execution_arn" {
  description = "Execution ARN of the private REST API"
  value       = aws_api_gateway_rest_api.private.execution_arn
}

output "vpc_link_id" {
  description = "ID of the VPC Link"
  value       = aws_apigatewayv2_vpc_link.main.id
}

output "cognito_authorizer_id" {
  description = "ID of the Cognito authorizer"
  value       = var.cognito_user_pool_arn != "" ? aws_api_gateway_authorizer.cognito[0].id : null
}

output "public_log_group_name" {
  description = "Name of the public API CloudWatch log group"
  value       = aws_cloudwatch_log_group.public_api.name
}

output "private_log_group_name" {
  description = "Name of the private API CloudWatch log group"
  value       = aws_cloudwatch_log_group.private_api.name
}

output "api_arn" {
  description = "AppSync GraphQL API ARN"
  value       = aws_appsync_graphql_api.main.arn
}

output "api_id" {
  description = "AppSync GraphQL API identifier"
  value       = aws_appsync_graphql_api.main.id
}

output "api_key" {
  description = "AppSync API key for smoke tests when create_api_key is true"
  value       = var.create_api_key ? aws_appsync_api_key.main[0].key : null
  sensitive   = true
}

output "graphql_endpoint" {
  description = "HTTPS GraphQL endpoint URL"
  value       = aws_appsync_graphql_api.main.uris["GRAPHQL"]
}

output "realtime_endpoint" {
  description = "WebSocket endpoint URL for AppSync subscriptions"
  value       = aws_appsync_graphql_api.main.uris["REALTIME"]
}

output "log_group_name" {
  description = "CloudWatch log group for AppSync field logs"
  value       = aws_cloudwatch_log_group.main.name
}

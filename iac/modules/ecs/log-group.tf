resource "aws_cloudwatch_log_group" "api_service" {
  name              = "/ecs/${local.api_service_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name    = local.api_service_name
    Service = "api-service"
  })
}

resource "aws_cloudwatch_log_group" "api_service" {
  name              = "/ecs/${local.api_service_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name    = local.api_service_name
    Service = "api-service"
  })
}

resource "aws_cloudwatch_log_group" "reservation_service" {
  name              = "/ecs/${local.reservation_service_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name    = local.reservation_service_name
    Service = "reservation-service"
  })
}

resource "aws_cloudwatch_log_group" "event_processor_service" {
  name              = "/ecs/${local.event_processor_service_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name    = local.event_processor_service_name
    Service = "event-processor-service"
  })
}

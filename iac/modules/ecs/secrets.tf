resource "aws_secretsmanager_secret" "api_service_env" {
  name                    = "${local.name_prefix}-api-service-env"
  recovery_window_in_days = local.secret_recovery_window_days

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-api-service-env"
    Service = "api-service"
  })
}

resource "aws_secretsmanager_secret_version" "api_service_env" {
  secret_id     = aws_secretsmanager_secret.api_service_env.id
  secret_string = jsonencode(local.api_service_env)
}

resource "aws_secretsmanager_secret" "reservation_service_env" {
  name                    = "${local.name_prefix}-reservation-service-env"
  recovery_window_in_days = local.secret_recovery_window_days

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-reservation-service-env"
    Service = "reservation-service"
  })
}

resource "aws_secretsmanager_secret_version" "reservation_service_env" {
  secret_id     = aws_secretsmanager_secret.reservation_service_env.id
  secret_string = jsonencode(local.reservation_service_env)
}

resource "aws_secretsmanager_secret" "event_processor_service_env" {
  name                    = "${local.name_prefix}-event-processor-service-env"
  recovery_window_in_days = local.secret_recovery_window_days

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-event-processor-service-env"
    Service = "event-processor-service"
  })
}

resource "aws_secretsmanager_secret_version" "event_processor_service_env" {
  secret_id     = aws_secretsmanager_secret.event_processor_service_env.id
  secret_string = jsonencode(local.event_processor_service_env)
}

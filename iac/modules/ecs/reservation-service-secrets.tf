locals {
  reservation_service_env = {
    DATABASE_URL  = local.api_service_env.DATABASE_URL
    REDIS_URL     = local.api_service_env.REDIS_URL
    KAFKA_BROKERS = var.kafka_bootstrap_brokers_sasl_iam
  }
}

resource "aws_secretsmanager_secret" "reservation_service_env" {
  name = "${local.name_prefix}-reservation-service-env"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-reservation-service-env"
    Service = "reservation-service"
  })
}

resource "aws_secretsmanager_secret_version" "reservation_service_env" {
  secret_id     = aws_secretsmanager_secret.reservation_service_env.id
  secret_string = jsonencode(local.reservation_service_env)
}

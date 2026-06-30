locals {
  name_prefix = "${var.project_name}-${var.environment}"

  api_service_name = coalesce(var.api_service_name, "${local.name_prefix}-api-service")

  reservation_service_name = coalesce(
    var.reservation_service_name,
    "${local.name_prefix}-reservation-service"
  )

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "ecs"
    }
  )

  rds_credentials = jsondecode(data.aws_secretsmanager_secret_version.rds_master.secret_string)

  database_url = format(
    "postgresql://%s:%s@%s:%s/%s?uselibpqcompat=true&sslmode=require",
    urlencode(local.rds_credentials.username),
    urlencode(local.rds_credentials.password),
    var.rds_cluster_endpoint,
    tostring(var.rds_cluster_port),
    var.rds_database_name
  )

  api_service_env = {
    DATABASE_URL = local.database_url
    REDIS_URL    = var.redis_url
  }

  reservation_service_env = {
    DATABASE_URL  = local.database_url
    REDIS_URL     = var.redis_url
    KAFKA_BROKERS = var.kafka_bootstrap_brokers_sasl_iam
  }

  # Default listener action forwards to api-service; explicit rules for reservation-service.
  alb_listener_rules = {
    reservation_reserve_post = {
      priority      = 10
      service       = "reservation_service"
      path_patterns = ["/parking/reserve"]
      http_methods  = ["POST"]
    }
    reservation_reserve_delete = {
      priority      = 11
      service       = "reservation_service"
      path_patterns = ["/parking/reserve/*"]
      http_methods  = ["DELETE"]
    }
  }

  secret_recovery_window_days = var.environment == "dev" ? 0 : 30
}

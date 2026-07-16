locals {
  name_prefix = "${var.project_name}-${var.environment}"

  api_service_name = coalesce(var.api_service_name, "${local.name_prefix}-api-service")

  admin_service_name = coalesce(
    var.admin_service_name,
    "${local.name_prefix}-admin-service"
  )

  reservation_service_name = coalesce(
    var.reservation_service_name,
    "${local.name_prefix}-reservation-service"
  )

  event_processor_service_name = coalesce(
    var.event_processor_service_name,
    "${local.name_prefix}-event-processor-service"
  )

  db_bootstrap_name = coalesce(
    var.db_bootstrap_name,
    "${local.name_prefix}-db-bootstrap"
  )

  bootstrap_admin_password = coalesce(
    var.bootstrap_admin_password,
    try(random_password.bootstrap_admin[0].result, null)
  )

  database_environment = [
    { name = "DB_HOST", value = var.rds_cluster_endpoint },
    { name = "DB_PORT", value = tostring(var.rds_cluster_port) },
    { name = "DB_NAME", value = var.rds_database_name },
    { name = "DB_SECRET_ARN", value = var.rds_master_user_secret_arn },
  ]

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "ecs"
    }
  )

  api_service_env = {
    REDIS_URL = var.redis_url
  }

  admin_service_env = {
    REDIS_URL                   = var.redis_url
    RFID_VALIDATIONS_TABLE_NAME = var.rfid_validations_table_name
  }

  reservation_service_env = {
    REDIS_URL     = var.redis_url
    KAFKA_BROKERS = var.kafka_bootstrap_brokers_sasl_iam
  }

  event_processor_service_env = {
    REDIS_URL     = var.redis_url
    KAFKA_BROKERS = var.kafka_bootstrap_brokers_sasl_iam
  }

  # Default listener action forwards to api-service; explicit rules for reservation-service.
  alb_listener_rule_target_groups = {
    api_service         = aws_lb_target_group.api_service.arn
    reservation_service = aws_lb_target_group.reservation_service.arn
    admin_service       = aws_lb_target_group.admin_service.arn
  }

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
    admin_routes = {
      priority      = 20
      service       = "admin_service"
      path_patterns = ["/admin", "/admin/*"]
      http_methods  = []
    }
  }

  secret_recovery_window_days = var.environment == "dev" ? 0 : 30
}

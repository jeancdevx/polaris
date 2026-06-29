data "aws_secretsmanager_secret_version" "rds_master" {
  secret_id = var.rds_master_user_secret_arn
}

locals {
  rds_credentials = jsondecode(data.aws_secretsmanager_secret_version.rds_master.secret_string)

  api_service_env = {
    DATABASE_URL = format(
      "postgresql://%s:%s@%s:%s/%s?uselibpqcompat=true&sslmode=require",
      urlencode(local.rds_credentials.username),
      urlencode(local.rds_credentials.password),
      var.rds_cluster_endpoint,
      tostring(var.rds_cluster_port),
      var.rds_database_name
    )
    REDIS_URL = var.redis_url
  }
}

resource "aws_secretsmanager_secret" "api_service_env" {
  name = "${local.name_prefix}-api-service-env"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-api-service-env"
    Service = "api-service"
  })
}

resource "aws_secretsmanager_secret_version" "api_service_env" {
  secret_id     = aws_secretsmanager_secret.api_service_env.id
  secret_string = jsonencode(local.api_service_env)
}

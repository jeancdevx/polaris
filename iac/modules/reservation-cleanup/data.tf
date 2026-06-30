data "aws_secretsmanager_secret_version" "rds_master" {
  secret_id = var.rds_master_secret_arn
}

locals {
  rds_credentials = jsondecode(data.aws_secretsmanager_secret_version.rds_master.secret_string)

  database_url = format(
    "postgresql://%s:%s@%s:%s/%s?uselibpqcompat=true&sslmode=require",
    urlencode(local.rds_credentials.username),
    urlencode(local.rds_credentials.password),
    var.rds_cluster_endpoint,
    tostring(var.rds_cluster_port),
    var.rds_database_name
  )
}

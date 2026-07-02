data "aws_secretsmanager_secret_version" "rds_master" {
  secret_id = var.rds_master_secret_arn
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  function_name = coalesce(
    var.function_name,
    "${local.name_prefix}-appsync-availability"
  )

  repository_root = abspath(coalesce(var.repository_root, "${path.module}/../../.."))

  lambda_module_dir = abspath(path.module)

  lambda_dist_dir = "${local.repository_root}/lambdas/appsync-availability/dist"

  lambda_zip_path = "${local.lambda_module_dir}/.terraform/${local.function_name}.zip"

  lambda_src_hash = sha256(join("", [
    for file_path in sort(fileset("${local.repository_root}/lambdas/appsync-availability", "**")) :
    filesha256("${local.repository_root}/lambdas/appsync-availability/${file_path}")
    if !startswith(file_path, "dist/") && !startswith(file_path, "node_modules/")
  ]))

  rds_credentials = jsondecode(data.aws_secretsmanager_secret_version.rds_master.secret_string)

  database_url = format(
    "postgresql://%s:%s@%s:%s/%s?uselibpqcompat=true&sslmode=require",
    urlencode(local.rds_credentials.username),
    urlencode(local.rds_credentials.password),
    var.rds_cluster_endpoint,
    tostring(var.rds_cluster_port),
    var.rds_database_name
  )

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "appsync-availability"
    }
  )
}

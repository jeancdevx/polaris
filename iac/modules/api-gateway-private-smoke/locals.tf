locals {
  name_prefix = "${var.project_name}-${var.environment}"

  function_name = coalesce(
    var.function_name,
    "${local.name_prefix}-api-gateway-private-smoke"
  )

  repository_root = abspath(coalesce(var.repository_root, "${path.module}/../../.."))

  lambda_module_dir = abspath(path.module)

  lambda_dist_dir = "${local.repository_root}/lambdas/api-gateway-private-smoke/dist"

  lambda_zip_path = "${local.lambda_module_dir}/.terraform/${local.function_name}.zip"

  lambda_src_hash = sha256(join("", [
    for file_path in sort(fileset("${local.repository_root}/lambdas/api-gateway-private-smoke", "**")) :
    filesha256("${local.repository_root}/lambdas/api-gateway-private-smoke/${file_path}")
    if !startswith(file_path, "dist/") && !startswith(file_path, "node_modules/")
  ]))

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "api-gateway-private-smoke"
    }
  )
}

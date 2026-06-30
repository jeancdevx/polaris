check "lambda_build_artifacts" {
  assert {
    condition = (
      fileexists("${local.lambda_dist_dir}/index.js") &&
      fileexists("${local.lambda_dist_dir}/package.json")
    )
    error_message = "Build audit-logger first: pnpm --filter @polaris/audit-logger build"
  }
}

data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = local.lambda_dist_dir
  output_path = local.lambda_zip_path
}

check "lambda_build_artifacts" {
  assert {
    condition = (
      fileexists("${local.lambda_dist_dir}/index.js") &&
      fileexists("${local.lambda_dist_dir}/package.json")
    )
    error_message = "Build notification-sender first: pnpm --filter @polaris/notification-sender build"
  }
}

data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = local.lambda_dist_dir
  output_path = local.lambda_zip_path
}

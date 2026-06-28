resource "terraform_data" "build_lambda" {
  input = local.lambda_src_hash

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = <<-EOT
      set -euo pipefail
      cd "${local.repository_root}"
      pnpm --filter @polaris/kafka-topic-creator build
      mkdir -p "$(dirname "${local.lambda_zip_path}")"
      rm -f "${local.lambda_zip_path}"
      (cd "${local.lambda_dist_dir}" && zip -j "${local.lambda_zip_path}" index.js package.json)
    EOT
  }
}

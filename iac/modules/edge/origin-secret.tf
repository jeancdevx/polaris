resource "random_password" "origin_verify" {
  length  = 48
  special = false
}

resource "aws_secretsmanager_secret" "origin_verify" {
  name = "${local.name_prefix}-cloudfront-origin-verify"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudfront-origin-verify"
  })
}

resource "aws_secretsmanager_secret_version" "origin_verify" {
  secret_id = aws_secretsmanager_secret.origin_verify.id
  secret_string = jsonencode({
    headerName  = var.origin_verify_header_name
    headerValue = random_password.origin_verify.result
  })
}

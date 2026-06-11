resource "aws_kms_key" "aurora" {
  count = 1

  description             = "KMS key for Aurora ${local.name} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "${local.name}-aurora-kms"
    Service = "aurora"
  })
}

resource "aws_kms_alias" "aurora" {
  count = 1

  name          = "alias/${local.name}-aurora"
  target_key_id = aws_kms_key.aurora[0].key_id
}

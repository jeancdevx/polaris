resource "aws_db_subnet_group" "main" {
  name_prefix = "${local.name_prefix}-aurora-"
  subnet_ids  = var.subnet_ids

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })

  lifecycle {
    create_before_destroy = true
  }
}

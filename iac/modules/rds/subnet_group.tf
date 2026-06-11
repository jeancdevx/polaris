resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-aurora-subnet-group"
  subnet_ids = var.data_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${local.name}-aurora-subnet-group"
  })
}

resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  description = "Aurora PostgreSQL cluster in data subnets"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
    Tier = "data"
  })

  lifecycle {
    create_before_destroy = true
  }
}

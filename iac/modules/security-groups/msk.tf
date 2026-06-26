resource "aws_security_group" "msk" {
  name_prefix = "${local.name_prefix}-msk-"
  description = "Amazon MSK brokers in data subnets"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-msk-sg"
    Tier = "data"
  })

  lifecycle {
    create_before_destroy = true
  }
}

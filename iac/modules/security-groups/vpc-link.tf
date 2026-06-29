resource "aws_security_group" "vpc_link" {
  name_prefix = "${local.name_prefix}-vpclink-"
  description = "API Gateway VPC link ENIs in private subnets"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpclink-sg"
    Tier = "private"
  })

  lifecycle {
    create_before_destroy = true
  }
}

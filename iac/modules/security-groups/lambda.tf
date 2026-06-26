resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-"
  description = "Lambda functions with VPC access in private subnets"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
    Tier = "private"
  })

  lifecycle {
    create_before_destroy = true
  }
}

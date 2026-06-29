resource "aws_apigatewayv2_vpc_link" "alb" {
  name               = "${local.name_prefix}-alb-vpc-link"
  subnet_ids         = var.private_subnet_ids
  security_group_ids = [var.vpc_link_security_group_id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-vpc-link"
  })
}

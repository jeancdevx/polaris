# VPC Link v2 para integración directa con ALB
resource "aws_apigatewayv2_vpc_link" "main" {
  name               = "${local.name}-vpc-link"
  security_group_ids = [var.vpc_link_security_group_id]
  subnet_ids         = var.private_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${local.name}-vpc-link"
  })
}

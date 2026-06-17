resource "aws_security_group" "api_gateway_vpc_link" {
  name_prefix = "${local.name}-api-gw-vpc-link-"
  description = "Security group for API Gateway VPC Link"
  vpc_id      = var.vpc_id

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-api-gw-vpc-link-sg"
  })
}

resource "aws_security_group" "api_gateway_vpc_endpoint" {
  name_prefix = "${local.name}-api-gw-vpce-"
  description = "Security group for API Gateway VPC Endpoint"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-api-gw-vpce-sg"
  })
}

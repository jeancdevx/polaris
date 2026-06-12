resource "aws_security_group" "alb" {
  count = var.enable_alb ? 1 : 0

  name_prefix = "${local.name}-alb-"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.alb_internal ? [data.aws_vpc.selected.cidr_block] : ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.alb_internal ? [data.aws_vpc.selected.cidr_block] : ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-alb-sg"
  })
}

resource "aws_security_group" "services" {
  count = 1

  name_prefix = "${local.name}-ecs-"
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.services
    content {
      description     = "Traffic from ALB to ${ingress.value.name}"
      from_port       = ingress.value.container_port
      to_port         = ingress.value.container_port
      protocol        = "tcp"
      security_groups = var.enable_alb ? [aws_security_group.alb[0].id] : []
    }
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-ecs-sg"
  })
}

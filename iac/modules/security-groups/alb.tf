resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  description = "Internal application load balancer (API Gateway VPC Link to ECS)"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
    Tier = "private"
  })

  lifecycle {
    create_before_destroy = true
  }
}

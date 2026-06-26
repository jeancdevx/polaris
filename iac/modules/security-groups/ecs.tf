resource "aws_security_group" "ecs" {
  name_prefix = "${local.name_prefix}-ecs-"
  description = "ECS Fargate tasks in private subnets"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-sg"
    Tier = "private"
  })

  lifecycle {
    create_before_destroy = true
  }
}

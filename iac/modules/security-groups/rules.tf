resource "aws_security_group_rule" "alb_http_ingress" {
  type              = "ingress"
  security_group_id = aws_security_group.alb.id
  protocol          = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_blocks       = local.alb_ingress_cidr_blocks
}

resource "aws_security_group_rule" "alb_https_ingress" {
  type              = "ingress"
  security_group_id = aws_security_group.alb.id
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = local.alb_ingress_cidr_blocks
}

resource "aws_security_group_rule" "ecs_from_alb" {
  type                     = "ingress"
  security_group_id        = aws_security_group.ecs.id
  protocol                 = "tcp"
  from_port                = var.ecs_container_port
  to_port                  = var.ecs_container_port
  source_security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "rds_from_ecs" {
  type                     = "ingress"
  security_group_id        = aws_security_group.rds.id
  protocol                 = "tcp"
  from_port                = var.rds_port
  to_port                  = var.rds_port
  source_security_group_id = aws_security_group.ecs.id
}

resource "aws_security_group_rule" "rds_from_lambda" {
  type                     = "ingress"
  security_group_id        = aws_security_group.rds.id
  protocol                 = "tcp"
  from_port                = var.rds_port
  to_port                  = var.rds_port
  source_security_group_id = aws_security_group.lambda.id
}

resource "aws_security_group_rule" "redis_from_ecs" {
  type                     = "ingress"
  security_group_id        = aws_security_group.redis.id
  protocol                 = "tcp"
  from_port                = var.redis_port
  to_port                  = var.redis_port
  source_security_group_id = aws_security_group.ecs.id
}

resource "aws_security_group_rule" "redis_from_lambda" {
  type                     = "ingress"
  security_group_id        = aws_security_group.redis.id
  protocol                 = "tcp"
  from_port                = var.redis_port
  to_port                  = var.redis_port
  source_security_group_id = aws_security_group.lambda.id
}

resource "aws_security_group_rule" "msk_self" {
  type              = "ingress"
  security_group_id = aws_security_group.msk.id
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  self              = true
}

resource "aws_security_group_rule" "msk_from_ecs" {
  type                     = "ingress"
  security_group_id        = aws_security_group.msk.id
  protocol                 = "tcp"
  from_port                = var.msk_client_port
  to_port                  = var.msk_client_port
  source_security_group_id = aws_security_group.ecs.id
}

resource "aws_security_group_rule" "msk_from_lambda" {
  type                     = "ingress"
  security_group_id        = aws_security_group.msk.id
  protocol                 = "tcp"
  from_port                = var.msk_client_port
  to_port                  = var.msk_client_port
  source_security_group_id = aws_security_group.lambda.id
}

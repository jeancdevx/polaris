resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-atlantis-alb"
  description = "Internet-facing ALB for Atlantis webhooks"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from GitHub webhooks"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis-alb"
  })
}

resource "aws_security_group" "service" {
  name        = "${local.name_prefix}-atlantis"
  description = "Atlantis ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Atlantis from ALB"
    from_port       = 4141
    to_port         = 4141
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis"
  })
}

resource "aws_lb" "atlantis" {
  name               = "${local.name_prefix}-atlantis"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis"
  })
}

resource "aws_lb_target_group" "atlantis" {
  name        = "${local.name_prefix}-atlantis"
  port        = 4141
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/healthz"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis"
  })
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.atlantis.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.atlantis.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.atlantis.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

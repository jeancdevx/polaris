resource "aws_lb_target_group" "api_service" {
  name_prefix = "api-"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    path                = var.health_check_path
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-api-service-tg"
    Service = "api-service"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "reservation_service" {
  name_prefix = "rsrv-"
  port        = var.reservation_service_container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    path                = var.health_check_path
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-reservation-service-tg"
    Service = "reservation-service"
  })

  lifecycle {
    create_before_destroy = true
  }
}

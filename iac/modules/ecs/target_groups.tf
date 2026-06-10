resource "aws_lb_target_group" "services" {
  for_each = var.services

  name        = "${local.name}-${each.value.name}"
  port        = each.value.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = each.value.health_check_path
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200-399"
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name}-${each.value.name}-tg"
    Service = each.value.name
  })
}

resource "aws_lb_listener_rule" "services" {
  for_each = var.services

  listener_arn = var.alb_certificate_arn != "" ? aws_lb_listener.https[0].arn : aws_lb_listener.http[0].arn
  priority     = 100 + index(keys(var.services), each.key)

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = ["/${each.value.name}/*", "/${each.value.name}"]
    }
  }

  tags = merge(local.common_tags, {
    Service = each.value.name
  })
}

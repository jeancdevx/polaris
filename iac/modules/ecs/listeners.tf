resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_service.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-http-listener"
  })
}

resource "aws_lb_listener_rule" "service" {
  for_each = local.alb_listener_rules

  listener_arn = aws_lb_listener.http.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = each.value.service == "reservation_service" ? aws_lb_target_group.reservation_service.arn : aws_lb_target_group.api_service.arn
  }

  condition {
    path_pattern {
      values = each.value.path_patterns
    }
  }

  condition {
    http_request_method {
      values = each.value.http_methods
    }
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-${replace(each.key, "_", "-")}-rule"
    Service = "reservation-service"
  })
}

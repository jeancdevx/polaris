resource "aws_lb_listener_rule" "reservation_reserve_post" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.reservation_service.arn
  }

  condition {
    path_pattern {
      values = ["/parking/reserve"]
    }
  }

  condition {
    http_request_method {
      values = ["POST"]
    }
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-reservation-post-rule"
    Service = "reservation-service"
  })
}

resource "aws_lb_listener_rule" "reservation_reserve_delete" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 11

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.reservation_service.arn
  }

  condition {
    path_pattern {
      values = ["/parking/reserve/*"]
    }
  }

  condition {
    http_request_method {
      values = ["DELETE"]
    }
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-reservation-delete-rule"
    Service = "reservation-service"
  })
}

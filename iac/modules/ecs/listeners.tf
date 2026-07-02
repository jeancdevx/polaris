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
    target_group_arn = local.alb_listener_rule_target_groups[each.value.service]
  }

  condition {
    path_pattern {
      values = each.value.path_patterns
    }
  }

  dynamic "condition" {
    for_each = length(each.value.http_methods) > 0 ? [1] : []

    content {
      http_request_method {
        values = each.value.http_methods
      }
    }
  }

  lifecycle {
    precondition {
      condition     = length(each.value.path_patterns) <= 5
      error_message = "ALB listener rules support at most 5 path pattern values per rule (${each.key})."
    }

    precondition {
      condition     = length(each.value.http_methods) <= 5
      error_message = "ALB listener rules support at most 5 HTTP method values per rule (${each.key})."
    }
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-${replace(each.key, "_", "-")}-rule"
    Service = replace(each.value.service, "_", "-")
  })
}

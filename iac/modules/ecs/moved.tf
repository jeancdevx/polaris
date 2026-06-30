moved {
  from = aws_lb_listener_rule.reservation_reserve_post
  to   = aws_lb_listener_rule.service["reservation_reserve_post"]
}

moved {
  from = aws_lb_listener_rule.reservation_reserve_delete
  to   = aws_lb_listener_rule.service["reservation_reserve_delete"]
}

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = var.alb_internal
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.alb_internal ? var.private_subnet_ids : var.public_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection

  dynamic "access_logs" {
    for_each = var.alb_logs_bucket_name != "" ? [1] : []

    content {
      bucket  = var.alb_logs_bucket_name
      enabled = true
      prefix  = var.alb_logs_prefix
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

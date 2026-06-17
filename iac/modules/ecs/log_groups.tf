resource "aws_cloudwatch_log_group" "services" {
  for_each = var.services

  name              = each.value.log_group_name != "" ? each.value.log_group_name : "/ecs/${local.name}-${each.value.name}"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name    = "${local.name}-${each.value.name}"
    Service = each.value.name
  })
}

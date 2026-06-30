resource "aws_cloudwatch_event_bus" "main" {
  name = var.bus_name

  tags = merge(local.common_tags, {
    Name = var.bus_name
  })
}

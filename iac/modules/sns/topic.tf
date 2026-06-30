resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-alerts"
    Purpose = "operational-alerts"
  })
}

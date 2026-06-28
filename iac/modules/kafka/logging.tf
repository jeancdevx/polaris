resource "aws_cloudwatch_log_group" "broker" {
  name              = "/aws/msk/${local.cluster_name}"
  retention_in_days = local.cloudwatch_log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-broker-logs"
  })
}

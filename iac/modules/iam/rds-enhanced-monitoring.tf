resource "aws_iam_role" "rds_enhanced_monitoring" {
  name_prefix        = "${local.name_prefix}-rds-monitoring-"
  assume_role_policy = data.aws_iam_policy_document.assume_rds_monitoring.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-monitoring-role"
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

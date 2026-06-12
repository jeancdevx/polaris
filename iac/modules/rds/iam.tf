data "aws_iam_policy_document" "enhanced_monitoring_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "enhanced_monitoring" {
  count = var.enable_enhanced_monitoring ? 1 : 0

  name               = "${local.name}-rds-enhanced-monitoring"
  assume_role_policy = data.aws_iam_policy_document.enhanced_monitoring_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "enhanced_monitoring" {
  count = var.enable_enhanced_monitoring ? 1 : 0

  role       = aws_iam_role.enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

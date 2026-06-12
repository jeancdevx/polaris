resource "aws_rds_cluster_instance" "writer" {
  count = var.writer_count

  identifier         = "${local.name}-aurora-writer-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  instance_class = var.scalability_type == "serverless-v2" ? "db.serverless" : var.provisioned_instance_class

  publicly_accessible        = false
  auto_minor_version_upgrade = true

  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? 7 : 0

  monitoring_interval = var.enable_enhanced_monitoring ? var.enhanced_monitoring_interval : 0
  monitoring_role_arn = var.enable_enhanced_monitoring ? aws_iam_role.enhanced_monitoring[0].arn : null

  tags = merge(local.common_tags, {
    Name = "${local.name}-aurora-writer-${count.index}"
    Role = "writer"
  })
}

resource "aws_rds_cluster_instance" "reader" {
  count = var.reader_count

  identifier         = "${local.name}-aurora-reader-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  instance_class = var.scalability_type == "serverless-v2" ? "db.serverless" : var.provisioned_instance_class

  publicly_accessible        = false
  auto_minor_version_upgrade = true

  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? 7 : 0

  monitoring_interval = var.enable_enhanced_monitoring ? var.enhanced_monitoring_interval : 0
  monitoring_role_arn = var.enable_enhanced_monitoring ? aws_iam_role.enhanced_monitoring[0].arn : null

  tags = merge(local.common_tags, {
    Name = "${local.name}-aurora-reader-${count.index}"
    Role = "reader"
  })
}

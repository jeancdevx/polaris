resource "aws_rds_cluster_instance" "writer" {
  count = local.use_serverless ? 0 : 1

  identifier_prefix  = "${local.name_prefix}-aurora-writer-"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  instance_class     = local.writer_instance_class

  publicly_accessible = false
  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? var.monitoring_role_arn : null

  performance_insights_enabled = local.performance_insights_enabled

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-writer"
    Role = "writer"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_rds_cluster_instance" "reader" {
  count = local.use_serverless ? 0 : local.reader_count

  identifier_prefix  = "${local.name_prefix}-aurora-reader-${count.index + 1}-"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  instance_class     = local.reader_instance_class
  promotion_tier     = count.index + 2

  publicly_accessible = false
  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? var.monitoring_role_arn : null

  performance_insights_enabled = local.performance_insights_enabled

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-reader-${count.index + 1}"
    Role = "reader"
  })

  lifecycle {
    create_before_destroy = true
  }
}

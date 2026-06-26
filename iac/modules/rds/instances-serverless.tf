resource "aws_rds_cluster_instance" "serverless" {
  count = local.use_serverless ? 1 : 0

  identifier_prefix  = "${local.name_prefix}-aurora-serverless-"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  instance_class     = "db.serverless"

  publicly_accessible = false
  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? var.monitoring_role_arn : null

  performance_insights_enabled = local.performance_insights_enabled

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-aurora-serverless"
    Role = "writer"
  })

  lifecycle {
    create_before_destroy = true
  }
}

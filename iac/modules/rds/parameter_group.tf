resource "aws_rds_cluster_parameter_group" "main" {
  name   = "${local.name}-aurora-params"
  family = local.parameter_group_family

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = parameter.value.apply_method
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-aurora-params"
  })
}

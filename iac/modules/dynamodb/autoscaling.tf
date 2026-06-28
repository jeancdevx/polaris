resource "aws_appautoscaling_target" "read" {
  for_each = local.use_on_demand ? toset([]) : toset(local.table_names)

  max_capacity       = local.autoscaling_max_read_capacity
  min_capacity       = local.read_capacity
  resource_id        = "table/${each.value}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_target" "write" {
  for_each = local.use_on_demand ? toset([]) : toset(local.table_names)

  max_capacity       = local.autoscaling_max_write_capacity
  min_capacity       = local.write_capacity
  resource_id        = "table/${each.value}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "read" {
  for_each = local.use_on_demand ? toset([]) : toset(local.table_names)

  name               = "${each.value}-read-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.read[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.read[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.read[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }

    target_value = var.autoscaling_target_read_utilization
  }
}

resource "aws_appautoscaling_policy" "write" {
  for_each = local.use_on_demand ? toset([]) : toset(local.table_names)

  name               = "${each.value}-write-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.write[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.write[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.write[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }

    target_value = var.autoscaling_target_write_utilization
  }
}

resource "aws_cloudwatch_event_rule" "appsync_occupancy_publisher" {
  name           = "${local.name_prefix}-sensor-occupancy-appsync"
  description    = "Route sensor.occupancy events to appsync-occupancy-publisher"
  event_bus_name = aws_cloudwatch_event_bus.main.name
  event_pattern = jsonencode({
    source      = [var.event_processor_source]
    detail-type = ["sensor.occupancy"]
  })

  tags = merge(local.common_tags, {
    Name       = "${local.name_prefix}-sensor-occupancy-appsync"
    DetailType = "sensor.occupancy"
    Target     = "appsync-occupancy-publisher"
  })
}

resource "aws_cloudwatch_event_target" "appsync_occupancy_publisher" {
  rule           = aws_cloudwatch_event_rule.appsync_occupancy_publisher.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  target_id      = "appsync-occupancy-publisher"
  arn            = var.appsync_occupancy_publisher_function_arn
}

resource "aws_lambda_permission" "appsync_occupancy_publisher" {
  statement_id  = "AllowExecutionFromEventBridge-sensor-occupancy-appsync"
  action        = "lambda:InvokeFunction"
  function_name = var.appsync_occupancy_publisher_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.appsync_occupancy_publisher.arn
}

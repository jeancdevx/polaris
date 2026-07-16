locals {
  xray_lambda_roles = {
    api_gateway_private_smoke   = aws_iam_role.api_gateway_private_smoke.name
    appsync_availability        = aws_iam_role.appsync_availability.name
    appsync_occupancy_publisher = aws_iam_role.appsync_occupancy_publisher.name
    audit_logger                = aws_iam_role.audit_logger.name
    health_checker              = aws_iam_role.health_checker.name
    kafka_msk_smoke             = aws_iam_role.kafka_msk_smoke.name
    kafka_topic_creator         = aws_iam_role.kafka_topic_creator.name
    notification_sender         = aws_iam_role.notification_sender.name
    reservation_cleanup         = aws_iam_role.reservation_cleanup.name
    rfid_validator              = aws_iam_role.rfid_validator.name
    sensor_data_processor       = aws_iam_role.sensor_data_processor.name
  }
}

data "aws_iam_policy_document" "xray_write" {
  statement {
    effect = "Allow"
    actions = [
      "xray:PutTelemetryRecords",
      "xray:PutTraceSegments"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "xray_write" {
  name_prefix = "${local.name_prefix}-xray-write-"
  description = "Write-only X-Ray permissions for actively traced Polaris Lambdas"
  policy      = data.aws_iam_policy_document.xray_write.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-xray-write-policy"
  })
}

resource "aws_iam_role_policy_attachment" "xray_write" {
  for_each = local.xray_lambda_roles

  role       = each.value
  policy_arn = aws_iam_policy.xray_write.arn
}

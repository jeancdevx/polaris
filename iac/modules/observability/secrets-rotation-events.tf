resource "aws_cloudwatch_event_rule" "secrets_rotation_failed" {
  name        = "${local.name_prefix}-secrets-rotation-failed"
  description = "Capture Secrets Manager automatic rotation failures"

  event_pattern = jsonencode({
    source      = ["aws.secretsmanager"]
    detail-type = ["AWS Service Event via CloudTrail"]
    detail = {
      eventSource = ["secretsmanager.amazonaws.com"]
      eventName   = ["RotationFailed"]
    }
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secrets-rotation-failed"
  })
}

resource "aws_cloudwatch_event_rule" "secrets_rotate_api_failed" {
  name        = "${local.name_prefix}-secrets-rotate-api-failed"
  description = "Capture failed Secrets Manager RotateSecret API calls"

  event_pattern = jsonencode({
    source      = ["aws.secretsmanager"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["secretsmanager.amazonaws.com"]
      eventName   = ["RotateSecret"]
      errorCode   = [{ exists = true }]
    }
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secrets-rotate-api-failed"
  })
}

resource "aws_cloudwatch_event_target" "secrets_rotation_failed" {
  for_each = {
    automatic = aws_cloudwatch_event_rule.secrets_rotation_failed.name
    api       = aws_cloudwatch_event_rule.secrets_rotate_api_failed.name
  }

  rule      = each.value
  target_id = "operational-alerts"
  arn       = var.sns_alerts_topic_arn
}

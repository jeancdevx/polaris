data "aws_iam_policy_document" "sns_alerts_cloudwatch" {
  statement {
    sid    = "AllowCloudWatchAlarms"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions   = ["SNS:Publish"]
    resources = [var.sns_alerts_topic_arn]
  }

  statement {
    sid    = "AllowEventBridgeRotationAlerts"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    actions   = ["SNS:Publish"]
    resources = [var.sns_alerts_topic_arn]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        aws_cloudwatch_event_rule.secrets_rotation_failed.arn,
        aws_cloudwatch_event_rule.secrets_rotate_api_failed.arn,
      ]
    }
  }
}

resource "aws_sns_topic_policy" "alerts_cloudwatch" {
  arn    = var.sns_alerts_topic_arn
  policy = data.aws_iam_policy_document.sns_alerts_cloudwatch.json
}

resource "aws_sns_topic_subscription" "alarm_email" {
  for_each = toset(var.alarm_email_endpoints)

  topic_arn = var.sns_alerts_topic_arn
  protocol  = "email"
  endpoint  = each.value
}

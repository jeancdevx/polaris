data "aws_iam_policy_document" "notification_sender_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-notification-sender:*"]
  }
}

data "aws_iam_policy_document" "notification_sender_notify" {
  statement {
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [
      "arn:aws:sns:${local.region}:${local.account_id}:${local.name_prefix}-alerts"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage"
    ]
    resources = [
      "arn:aws:sqs:${local.region}:${local.account_id}:${local.name_prefix}-dlq-notification-sender"
    ]
  }
}

resource "aws_iam_policy" "notification_sender_execution" {
  name_prefix = "${local.name_prefix}-notification-sender-exec-"
  description = "CloudWatch Logs access for notification-sender Lambda"
  policy      = data.aws_iam_policy_document.notification_sender_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-notification-sender-exec-policy"
  })
}

resource "aws_iam_policy" "notification_sender_notify" {
  name_prefix = "${local.name_prefix}-notification-sender-notify-"
  description = "SNS and DLQ access for notification-sender Lambda"
  policy      = data.aws_iam_policy_document.notification_sender_notify.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-notification-sender-notify-policy"
  })
}

resource "aws_iam_role" "notification_sender" {
  name_prefix        = "${local.name_prefix}-notification-sender-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-notification-sender-role"
  })
}

resource "aws_iam_role_policy_attachment" "notification_sender_execution" {
  role       = aws_iam_role.notification_sender.name
  policy_arn = aws_iam_policy.notification_sender_execution.arn
}

resource "aws_iam_role_policy_attachment" "notification_sender_notify" {
  role       = aws_iam_role.notification_sender.name
  policy_arn = aws_iam_policy.notification_sender_notify.arn
}

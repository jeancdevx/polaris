data "aws_iam_policy_document" "reservation_cleanup_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-reservation-cleanup:*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "reservation_cleanup_execution" {
  name_prefix = "${local.name_prefix}-reservation-cleanup-exec-"
  description = "CloudWatch Logs and VPC ENI access for reservation-cleanup Lambda"
  policy      = data.aws_iam_policy_document.reservation_cleanup_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reservation-cleanup-exec-policy"
  })
}

resource "aws_iam_role" "reservation_cleanup" {
  name_prefix        = "${local.name_prefix}-reservation-cleanup-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-reservation-cleanup-role"
  })
}

resource "aws_iam_role_policy_attachment" "reservation_cleanup_msk_client" {
  role       = aws_iam_role.reservation_cleanup.name
  policy_arn = aws_iam_policy.msk_client.arn
}

resource "aws_iam_role_policy_attachment" "reservation_cleanup_execution" {
  role       = aws_iam_role.reservation_cleanup.name
  policy_arn = aws_iam_policy.reservation_cleanup_execution.arn
}

resource "aws_iam_role_policy_attachment" "reservation_cleanup_secrets_read" {
  role       = aws_iam_role.reservation_cleanup.name
  policy_arn = aws_iam_policy.secrets_read.arn
}

resource "aws_iam_role_policy_attachment" "reservation_cleanup_eventbridge_publish" {
  role       = aws_iam_role.reservation_cleanup.name
  policy_arn = aws_iam_policy.eventbridge_publish.arn
}

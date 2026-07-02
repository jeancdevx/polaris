data "aws_iam_policy_document" "assume_appsync" {
  statement {
    effect = "Allow"

    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["appsync.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "logging" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "${aws_cloudwatch_log_group.main.arn}:*"
    ]
  }
}

resource "aws_iam_role" "logging" {
  name_prefix        = "${local.name_prefix}-appsync-logs-"
  assume_role_policy = data.aws_iam_policy_document.assume_appsync.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-appsync-logs-role"
  })
}

resource "aws_iam_role_policy" "logging" {
  name_prefix = "${local.name_prefix}-appsync-logs-"
  role        = aws_iam_role.logging.id
  policy      = data.aws_iam_policy_document.logging.json
}

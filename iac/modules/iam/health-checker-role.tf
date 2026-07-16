data "aws_iam_policy_document" "health_checker_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-health-checker:*"]
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

data "aws_iam_policy_document" "health_checker_alerts" {
  statement {
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [
      "arn:aws:sns:${local.region}:${local.account_id}:${local.name_prefix}-alerts"
    ]
  }
}

resource "aws_iam_policy" "health_checker_execution" {
  name_prefix = "${local.name_prefix}-health-checker-exec-"
  description = "CloudWatch Logs and VPC ENI access for health-checker Lambda"
  policy      = data.aws_iam_policy_document.health_checker_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-checker-exec-policy"
  })
}

resource "aws_iam_policy" "health_checker_alerts" {
  name_prefix = "${local.name_prefix}-health-checker-alerts-"
  description = "SNS alert publishing for health-checker Lambda"
  policy      = data.aws_iam_policy_document.health_checker_alerts.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-checker-alerts-policy"
  })
}

resource "aws_iam_role" "health_checker" {
  name_prefix        = "${local.name_prefix}-health-checker-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-checker-role"
  })
}

resource "aws_iam_role_policy_attachment" "health_checker_execution" {
  role       = aws_iam_role.health_checker.name
  policy_arn = aws_iam_policy.health_checker_execution.arn
}

resource "aws_iam_role_policy_attachment" "health_checker_alerts" {
  role       = aws_iam_role.health_checker.name
  policy_arn = aws_iam_policy.health_checker_alerts.arn
}

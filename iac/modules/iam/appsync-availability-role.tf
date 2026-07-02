data "aws_iam_policy_document" "appsync_availability_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-appsync-availability:*"]
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

resource "aws_iam_policy" "appsync_availability_execution" {
  name_prefix = "${local.name_prefix}-appsync-avail-exec-"
  description = "CloudWatch Logs and VPC ENI access for appsync-availability Lambda"
  policy      = data.aws_iam_policy_document.appsync_availability_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-appsync-availability-exec-policy"
  })
}

resource "aws_iam_role" "appsync_availability" {
  name_prefix        = "${local.name_prefix}-appsync-avail-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-appsync-availability-role"
  })
}

resource "aws_iam_role_policy_attachment" "appsync_availability_execution" {
  role       = aws_iam_role.appsync_availability.name
  policy_arn = aws_iam_policy.appsync_availability_execution.arn
}

resource "aws_iam_role_policy_attachment" "appsync_availability_secrets_read" {
  role       = aws_iam_role.appsync_availability.name
  policy_arn = aws_iam_policy.secrets_read.arn
}

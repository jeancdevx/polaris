data "aws_iam_policy_document" "kafka_msk_smoke_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-kafka-msk-smoke:*"]
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

resource "aws_iam_policy" "kafka_msk_smoke_execution" {
  name_prefix = "${local.name_prefix}-kafka-msk-smoke-exec-"
  description = "CloudWatch Logs and VPC ENI access for kafka-msk-smoke Lambda"
  policy      = data.aws_iam_policy_document.kafka_msk_smoke_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kafka-msk-smoke-exec-policy"
  })
}

resource "aws_iam_role" "kafka_msk_smoke" {
  name_prefix        = "${local.name_prefix}-kafka-msk-smoke-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kafka-msk-smoke-role"
  })
}

resource "aws_iam_role_policy_attachment" "kafka_msk_smoke_msk_client" {
  role       = aws_iam_role.kafka_msk_smoke.name
  policy_arn = aws_iam_policy.msk_client.arn
}

resource "aws_iam_role_policy_attachment" "kafka_msk_smoke_execution" {
  role       = aws_iam_role.kafka_msk_smoke.name
  policy_arn = aws_iam_policy.kafka_msk_smoke_execution.arn
}

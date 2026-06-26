data "aws_iam_policy_document" "kafka_topic_creator_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-kafka-topic-creator:*"]
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

resource "aws_iam_policy" "kafka_topic_creator_execution" {
  name_prefix = "${local.name_prefix}-kafka-topic-creator-exec-"
  description = "CloudWatch Logs and VPC ENI access for kafka-topic-creator Lambda"
  policy      = data.aws_iam_policy_document.kafka_topic_creator_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kafka-topic-creator-exec-policy"
  })
}

resource "aws_iam_role" "kafka_topic_creator" {
  name_prefix        = "${local.name_prefix}-kafka-topic-creator-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kafka-topic-creator-role"
  })
}

resource "aws_iam_role_policy_attachment" "kafka_topic_creator_msk_admin" {
  role       = aws_iam_role.kafka_topic_creator.name
  policy_arn = aws_iam_policy.msk_topic_admin.arn
}

resource "aws_iam_role_policy_attachment" "kafka_topic_creator_execution" {
  role       = aws_iam_role.kafka_topic_creator.name
  policy_arn = aws_iam_policy.kafka_topic_creator_execution.arn
}

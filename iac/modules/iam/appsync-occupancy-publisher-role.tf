data "aws_iam_policy_document" "appsync_occupancy_publisher_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-appsync-occupancy-publisher:*"]
  }
}

resource "aws_iam_policy" "appsync_occupancy_publisher_execution" {
  name_prefix = "${local.name_prefix}-appsync-occ-pub-exec-"
  description = "CloudWatch Logs access for appsync-occupancy-publisher Lambda"
  policy      = data.aws_iam_policy_document.appsync_occupancy_publisher_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-appsync-occupancy-publisher-exec-policy"
  })
}

resource "aws_iam_role" "appsync_occupancy_publisher" {
  name_prefix        = "${local.name_prefix}-appsync-occ-pub-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-appsync-occupancy-publisher-role"
  })
}

resource "aws_iam_role_policy_attachment" "appsync_occupancy_publisher_execution" {
  role       = aws_iam_role.appsync_occupancy_publisher.name
  policy_arn = aws_iam_policy.appsync_occupancy_publisher_execution.arn
}

data "aws_iam_policy_document" "sensor_data_processor_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-sensor-data-processor:*"]
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

data "aws_iam_policy_document" "sensor_data_processor_data" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem"
    ]
    resources = [
      "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${local.name_prefix}-SensorReadings"
    ]
  }
}

resource "aws_iam_policy" "sensor_data_processor_execution" {
  name_prefix = "${local.name_prefix}-sensor-data-processor-exec-"
  description = "CloudWatch Logs and VPC ENI access for sensor-data-processor Lambda"
  policy      = data.aws_iam_policy_document.sensor_data_processor_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sensor-data-processor-exec-policy"
  })
}

resource "aws_iam_policy" "sensor_data_processor_data" {
  name_prefix = "${local.name_prefix}-sensor-data-processor-data-"
  description = "DynamoDB SensorReadings writes for sensor-data-processor Lambda"
  policy      = data.aws_iam_policy_document.sensor_data_processor_data.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sensor-data-processor-data-policy"
  })
}

resource "aws_iam_role" "sensor_data_processor" {
  name_prefix        = "${local.name_prefix}-sensor-data-processor-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sensor-data-processor-role"
  })
}

resource "aws_iam_role_policy_attachment" "sensor_data_processor_msk_client" {
  role       = aws_iam_role.sensor_data_processor.name
  policy_arn = aws_iam_policy.msk_client.arn
}

resource "aws_iam_role_policy_attachment" "sensor_data_processor_execution" {
  role       = aws_iam_role.sensor_data_processor.name
  policy_arn = aws_iam_policy.sensor_data_processor_execution.arn
}

resource "aws_iam_role_policy_attachment" "sensor_data_processor_data" {
  role       = aws_iam_role.sensor_data_processor.name
  policy_arn = aws_iam_policy.sensor_data_processor_data.arn
}

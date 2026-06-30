data "aws_iam_policy_document" "rfid_validator_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-rfid-validator:*"]
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

data "aws_iam_policy_document" "rfid_validator_data" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem"
    ]
    resources = [
      "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${local.name_prefix}-RFIDValidations"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "iot:Publish"
    ]
    resources = [
      "arn:aws:iot:${local.region}:${local.account_id}:topic/parking/commands/*"
    ]
  }
}

resource "aws_iam_policy" "rfid_validator_execution" {
  name_prefix = "${local.name_prefix}-rfid-validator-exec-"
  description = "CloudWatch Logs and VPC ENI access for rfid-validator Lambda"
  policy      = data.aws_iam_policy_document.rfid_validator_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rfid-validator-exec-policy"
  })
}

resource "aws_iam_policy" "rfid_validator_data" {
  name_prefix = "${local.name_prefix}-rfid-validator-data-"
  description = "DynamoDB RFID lookup and IoT command publish for rfid-validator Lambda"
  policy      = data.aws_iam_policy_document.rfid_validator_data.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rfid-validator-data-policy"
  })
}

resource "aws_iam_role" "rfid_validator" {
  name_prefix        = "${local.name_prefix}-rfid-validator-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rfid-validator-role"
  })
}

resource "aws_iam_role_policy_attachment" "rfid_validator_msk_client" {
  role       = aws_iam_role.rfid_validator.name
  policy_arn = aws_iam_policy.msk_client.arn
}

resource "aws_iam_role_policy_attachment" "rfid_validator_execution" {
  role       = aws_iam_role.rfid_validator.name
  policy_arn = aws_iam_policy.rfid_validator_execution.arn
}

resource "aws_iam_role_policy_attachment" "rfid_validator_data" {
  role       = aws_iam_role.rfid_validator.name
  policy_arn = aws_iam_policy.rfid_validator_data.arn
}

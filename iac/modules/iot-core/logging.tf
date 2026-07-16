data "aws_iam_policy_document" "iot_logging_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["iot.amazonaws.com"]
    }
  }
}

resource "aws_cloudwatch_log_group" "iot" {
  name              = "AWSIotLogsV2"
  retention_in_days = var.environment == "prod" ? 90 : 14

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-iot-logs"
  })
}

resource "aws_iam_role" "iot_logging" {
  name_prefix        = "${local.name_prefix}-iot-logging-"
  assume_role_policy = data.aws_iam_policy_document.iot_logging_assume.json

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-iot-logging-role"
  })
}

data "aws_iam_policy_document" "iot_logging" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents"
    ]
    resources = ["${aws_cloudwatch_log_group.iot.arn}:*"]
  }
}

resource "aws_iam_role_policy" "iot_logging" {
  name   = "${local.name_prefix}-iot-logging"
  role   = aws_iam_role.iot_logging.id
  policy = data.aws_iam_policy_document.iot_logging.json
}

resource "aws_iot_logging_options" "main" {
  default_log_level = "ERROR"
  role_arn          = aws_iam_role.iot_logging.arn

  depends_on = [aws_iam_role_policy.iot_logging]
}

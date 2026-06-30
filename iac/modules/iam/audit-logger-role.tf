data "aws_iam_policy_document" "audit_logger_execution" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-audit-logger:*",
      "arn:aws:logs:${local.region}:${local.account_id}:log-group:/polaris/audit:*"
    ]
  }
}

data "aws_iam_policy_document" "audit_logger_archive" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:AbortMultipartUpload"
    ]
    resources = [
      "arn:aws:s3:::${var.project_name}-audit-logs-*/*"
    ]
  }
}

resource "aws_iam_policy" "audit_logger_execution" {
  name_prefix = "${local.name_prefix}-audit-logger-exec-"
  description = "CloudWatch Logs access for audit-logger Lambda"
  policy      = data.aws_iam_policy_document.audit_logger_execution.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logger-exec-policy"
  })
}

resource "aws_iam_policy" "audit_logger_archive" {
  name_prefix = "${local.name_prefix}-audit-logger-archive-"
  description = "S3 audit archive writes for audit-logger Lambda"
  policy      = data.aws_iam_policy_document.audit_logger_archive.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logger-archive-policy"
  })
}

resource "aws_iam_role" "audit_logger" {
  name_prefix        = "${local.name_prefix}-audit-logger-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logger-role"
  })
}

resource "aws_iam_role_policy_attachment" "audit_logger_execution" {
  role       = aws_iam_role.audit_logger.name
  policy_arn = aws_iam_policy.audit_logger_execution.arn
}

resource "aws_iam_role_policy_attachment" "audit_logger_archive" {
  role       = aws_iam_role.audit_logger.name
  policy_arn = aws_iam_policy.audit_logger_archive.arn
}

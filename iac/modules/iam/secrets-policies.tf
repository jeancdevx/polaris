data "aws_iam_policy_document" "secrets_read" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = local.secrets_resource_arns
  }

  statement {
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]
    resources = local.kms_decrypt_resource_arns
  }
}

resource "aws_iam_policy" "secrets_read" {
  name_prefix = "${local.name_prefix}-secrets-read-"
  description = "Read RDS credentials and related secrets from Secrets Manager"
  policy      = data.aws_iam_policy_document.secrets_read.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secrets-read-policy"
  })
}

data "aws_iam_policy_document" "secrets_rotation" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:PutSecretValue",
      "secretsmanager:DescribeSecret",
      "secretsmanager:UpdateSecretVersionStage"
    ]
    resources = local.secrets_resource_arns
  }

  statement {
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:DescribeKey"
    ]
    resources = local.kms_decrypt_resource_arns
  }

  statement {
    effect = "Allow"
    actions = [
      "rds:DescribeDBClusters",
      "rds:DescribeDBInstances",
      "rds:ModifyDBCluster",
      "rds:ModifyDBInstance"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:DescribeSubnets",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeVpcs"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"]
  }
}

resource "aws_iam_policy" "secrets_rotation" {
  name_prefix = "${local.name_prefix}-secrets-rotation-"
  description = "Rotate RDS credentials stored in Secrets Manager"
  policy      = data.aws_iam_policy_document.secrets_rotation.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secrets-rotation-policy"
  })
}

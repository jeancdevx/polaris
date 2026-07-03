data "aws_iam_policy_document" "task_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_execution" {
  name = "${local.name_prefix}-atlantis-exec"

  assume_role_policy = data.aws_iam_policy_document.task_assume.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis-exec"
  })
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "task_execution_secrets" {
  statement {
    sid    = "ReadAtlantisSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = [aws_secretsmanager_secret.atlantis.arn]
  }
}

resource "aws_iam_role_policy" "task_execution_secrets" {
  name   = "${local.name_prefix}-atlantis-secrets"
  role   = aws_iam_role.task_execution.id
  policy = data.aws_iam_policy_document.task_execution_secrets.json
}

resource "aws_iam_role" "task" {
  name = "${local.name_prefix}-atlantis-task"

  assume_role_policy = data.aws_iam_policy_document.task_assume.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-atlantis-task"
  })
}

data "aws_iam_policy_document" "task_plan" {
  statement {
    sid    = "TerraformStateReadWrite"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketVersioning",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = [
      "arn:aws:s3:::${var.state_bucket_name}",
      "arn:aws:s3:::${var.state_bucket_name}/*"
    ]
  }
}

resource "aws_iam_role_policy" "task_plan_state" {
  name   = "${local.name_prefix}-atlantis-state"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task_plan.json
}

resource "aws_iam_role_policy_attachment" "task_read_only" {
  role       = aws_iam_role.task.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

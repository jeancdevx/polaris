data "aws_iam_policy_document" "task_execution_assume" {
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
  count = var.task_execution_role_arn == "" ? 1 : 0

  name               = "${local.name}-ecs-task-execution"
  assume_role_policy = data.aws_iam_policy_document.task_execution_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  count = var.task_execution_role_arn == "" ? 1 : 0

  role       = aws_iam_role.task_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "task_execution_secrets" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = ["arn:aws:secretsmanager:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:secret:${local.name}-*"]
  }
}

resource "aws_iam_role_policy" "task_execution_secrets" {
  count = var.task_execution_role_arn == "" ? 1 : 0

  name   = "${local.name}-ecs-secrets"
  role   = aws_iam_role.task_execution[0].name
  policy = data.aws_iam_policy_document.task_execution_secrets.json
}

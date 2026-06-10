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

resource "aws_iam_role_policy_attachment" "task_execution_secrets" {
  count = var.task_execution_role_arn == "" ? 1 : 0

  role       = aws_iam_role.task_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}

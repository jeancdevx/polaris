data "aws_iam_policy_document" "ecs_db_bootstrap_cognito" {
  count = var.enable_ecs_db_bootstrap_cognito_policy ? 1 : 0

  statement {
    effect = "Allow"
    actions = [
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminSetUserPassword"
    ]
    resources = [var.cognito_user_pool_arn]
  }
}

resource "aws_iam_policy" "ecs_db_bootstrap_cognito" {
  count = var.enable_ecs_db_bootstrap_cognito_policy ? 1 : 0

  name_prefix = "${local.name_prefix}-ecs-db-bootstrap-cognito-"
  description = "Cognito admin bootstrap access for db-bootstrap ECS tasks"
  policy      = data.aws_iam_policy_document.ecs_db_bootstrap_cognito[0].json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-db-bootstrap-cognito-policy"
  })
}

resource "aws_iam_role" "ecs_db_bootstrap_task" {
  name_prefix        = "${local.name_prefix}-ecs-db-bootstrap-task-"
  assume_role_policy = data.aws_iam_policy_document.assume_ecs_task.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-db-bootstrap-task-role"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_db_bootstrap_cognito" {
  count = var.enable_ecs_db_bootstrap_cognito_policy ? 1 : 0

  role       = aws_iam_role.ecs_db_bootstrap_task.name
  policy_arn = aws_iam_policy.ecs_db_bootstrap_cognito[0].arn
}

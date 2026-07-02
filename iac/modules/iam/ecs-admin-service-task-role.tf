data "aws_iam_policy_document" "ecs_admin_service_cognito" {
  count = var.enable_ecs_admin_service_cognito_policy ? 1 : 0

  statement {
    effect = "Allow"
    actions = [
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminSetUserPassword"
    ]
    resources = [var.cognito_user_pool_arn]
  }
}

data "aws_iam_policy_document" "ecs_admin_service_dynamodb" {
  count = var.enable_ecs_admin_service_dynamodb_policy ? 1 : 0

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem"
    ]
    resources = [
      "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${local.name_prefix}-RFIDValidations"
    ]
  }
}

resource "aws_iam_policy" "ecs_admin_service_cognito" {
  count = var.enable_ecs_admin_service_cognito_policy ? 1 : 0

  name_prefix = "${local.name_prefix}-ecs-admin-cognito-"
  description = "Cognito admin API access for admin-service ECS tasks"
  policy      = data.aws_iam_policy_document.ecs_admin_service_cognito[0].json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-admin-service-cognito-policy"
  })
}

resource "aws_iam_policy" "ecs_admin_service_dynamodb" {
  count = var.enable_ecs_admin_service_dynamodb_policy ? 1 : 0

  name_prefix = "${local.name_prefix}-ecs-admin-dynamodb-"
  description = "DynamoDB RFIDValidations access for admin-service ECS tasks"
  policy      = data.aws_iam_policy_document.ecs_admin_service_dynamodb[0].json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-admin-service-dynamodb-policy"
  })
}

resource "aws_iam_role" "ecs_admin_service_task" {
  name_prefix        = "${local.name_prefix}-ecs-admin-task-"
  assume_role_policy = data.aws_iam_policy_document.assume_ecs_task.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-admin-service-task-role"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_admin_service_cognito" {
  count = var.enable_ecs_admin_service_cognito_policy ? 1 : 0

  role       = aws_iam_role.ecs_admin_service_task.name
  policy_arn = aws_iam_policy.ecs_admin_service_cognito[0].arn
}

resource "aws_iam_role_policy_attachment" "ecs_admin_service_dynamodb" {
  count = var.enable_ecs_admin_service_dynamodb_policy ? 1 : 0

  role       = aws_iam_role.ecs_admin_service_task.name
  policy_arn = aws_iam_policy.ecs_admin_service_dynamodb[0].arn
}

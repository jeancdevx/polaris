data "aws_iam_policy_document" "assume_ecs_task" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "ecs_api_service_cognito" {
  count = var.cognito_user_pool_arn != "" ? 1 : 0

  statement {
    effect = "Allow"
    actions = [
      "cognito-idp:InitiateAuth",
      "cognito-idp:RevokeToken",
      "cognito-idp:GlobalSignOut"
    ]
    resources = [var.cognito_user_pool_arn]
  }
}

resource "aws_iam_policy" "ecs_api_service_cognito" {
  count = var.cognito_user_pool_arn != "" ? 1 : 0

  name_prefix = "${local.name_prefix}-ecs-api-cognito-"
  description = "Cognito auth API access for api-service ECS tasks"
  policy      = data.aws_iam_policy_document.ecs_api_service_cognito[0].json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-api-service-cognito-policy"
  })
}

resource "aws_iam_role" "ecs_api_service_task" {
  name_prefix        = "${local.name_prefix}-ecs-api-task-"
  assume_role_policy = data.aws_iam_policy_document.assume_ecs_task.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-api-service-task-role"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_api_service_cognito" {
  count = var.cognito_user_pool_arn != "" ? 1 : 0

  role       = aws_iam_role.ecs_api_service_task.name
  policy_arn = aws_iam_policy.ecs_api_service_cognito[0].arn
}

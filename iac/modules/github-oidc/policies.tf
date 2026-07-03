# Permisos mínimos del pipeline de CD:
#  - push de imágenes a los repos ECR del proyecto/entorno
#  - forzar nuevo despliegue de los servicios ECS del cluster del entorno
data "aws_iam_policy_document" "deploy" {
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "EcrPushPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeRepositories",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart"
    ]
    resources = [
      "arn:aws:ecr:${local.region}:${local.account_id}:repository/${local.name_prefix}-*"
    ]
  }

  statement {
    sid    = "EcsRedeploy"
    effect = "Allow"
    actions = [
      "ecs:DescribeServices",
      "ecs:UpdateService"
    ]
    resources = [
      "arn:aws:ecs:${local.region}:${local.account_id}:service/${local.name_prefix}-cluster/${local.name_prefix}-*"
    ]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "${local.name_prefix}-github-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}

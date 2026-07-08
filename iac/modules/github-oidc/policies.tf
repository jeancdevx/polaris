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

  statement {
    sid    = "EcsRunBootstrapTask"
    effect = "Allow"
    actions = [
      "ecs:DescribeTaskDefinition",
      "ecs:DescribeTasks",
      "ecs:RegisterTaskDefinition",
      "ecs:RunTask",
      "ecs:StopTask"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "Ec2ReadNetworkForBootstrap"
    effect = "Allow"
    actions = [
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSubnets"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudWatchLogsBootstrap"
    effect = "Allow"
    actions = [
      "logs:DescribeLogStreams",
      "logs:GetLogEvents"
    ]
    resources = [
      "arn:aws:logs:${local.region}:${local.account_id}:log-group:/ecs/${local.name_prefix}-db-bootstrap:*"
    ]
  }

  statement {
    sid     = "PassBootstrapTaskRoles"
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      "arn:aws:iam::${local.account_id}:role/${local.name_prefix}-ecs-exec-*",
      "arn:aws:iam::${local.account_id}:role/${local.name_prefix}-ecs-db-bootstrap-task-*"
    ]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }

  dynamic "statement" {
    for_each = var.assets_bucket_arn != "" ? [1] : []

    content {
      sid    = "WebAdminS3Deploy"
      effect = "Allow"
      actions = [
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:PutObject"
      ]
      resources = [
        var.assets_bucket_arn,
        "${var.assets_bucket_arn}/${var.web_admin_s3_prefix}/*"
      ]
    }
  }

  dynamic "statement" {
    for_each = var.web_cloudfront_distribution_id != "" ? [1] : []

    content {
      sid    = "WebAdminCloudFrontInvalidate"
      effect = "Allow"
      actions = [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ]
      resources = [
        "arn:aws:cloudfront::${local.account_id}:distribution/${var.web_cloudfront_distribution_id}"
      ]
    }
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "${local.name_prefix}-github-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}

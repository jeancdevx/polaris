data "aws_iam_policy_document" "appsync_graphql" {
  statement {
    effect = "Allow"
    actions = [
      "appsync:GraphQL"
    ]
    resources = [
      "${var.appsync_api_arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "appsync_graphql" {
  name_prefix = "${local.name_prefix}-appsync-occ-pub-graphql-"
  role        = var.lambda_role_name
  policy      = data.aws_iam_policy_document.appsync_graphql.json
}

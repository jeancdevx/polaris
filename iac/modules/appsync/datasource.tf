resource "aws_appsync_datasource" "availability" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "AvailabilityLambda"
  service_role_arn = aws_iam_role.datasource.arn
  type             = "AWS_LAMBDA"

  lambda_config {
    function_arn = var.availability_lambda_function_arn
  }
}

data "aws_iam_policy_document" "assume_appsync_datasource" {
  statement {
    effect = "Allow"

    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["appsync.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "datasource_invoke" {
  statement {
    effect = "Allow"

    actions = [
      "lambda:InvokeFunction"
    ]

    resources = [var.availability_lambda_function_arn]
  }
}

resource "aws_iam_role" "datasource" {
  name_prefix        = "${local.name_prefix}-appsync-ds-"
  assume_role_policy = data.aws_iam_policy_document.assume_appsync_datasource.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-appsync-datasource-role"
  })
}

resource "aws_iam_role_policy" "datasource_invoke" {
  name_prefix = "${local.name_prefix}-appsync-ds-invoke-"
  role        = aws_iam_role.datasource.id
  policy      = data.aws_iam_policy_document.datasource_invoke.json
}

resource "aws_lambda_permission" "availability" {
  statement_id  = "AllowExecutionFromAppSync"
  action        = "lambda:InvokeFunction"
  function_name = var.availability_lambda_function_name
  principal     = "appsync.amazonaws.com"
  source_arn    = aws_appsync_graphql_api.main.arn
}

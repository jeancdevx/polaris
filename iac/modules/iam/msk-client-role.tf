data "aws_iam_policy_document" "assume_msk_client" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com", "lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "msk_client" {
  name_prefix        = "${local.name_prefix}-msk-client-"
  assume_role_policy = data.aws_iam_policy_document.assume_msk_client.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-msk-client-role"
  })
}

resource "aws_iam_role_policy_attachment" "msk_client" {
  role       = aws_iam_role.msk_client.name
  policy_arn = aws_iam_policy.msk_client.arn
}

resource "aws_iam_role_policy_attachment" "msk_client_secrets_read" {
  role       = aws_iam_role.msk_client.name
  policy_arn = aws_iam_policy.secrets_read.arn
}

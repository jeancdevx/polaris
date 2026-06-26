resource "aws_iam_role" "secrets_rotation" {
  name_prefix        = "${local.name_prefix}-secrets-rotation-"
  assume_role_policy = data.aws_iam_policy_document.assume_lambda.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secrets-rotation-role"
  })
}

resource "aws_iam_role_policy_attachment" "secrets_rotation" {
  role       = aws_iam_role.secrets_rotation.name
  policy_arn = aws_iam_policy.secrets_rotation.arn
}

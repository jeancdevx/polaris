data "aws_iam_policy_document" "state_access" {
  statement {
    sid    = "ListStateBucket"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketVersioning"
    ]
    resources = ["arn:aws:s3:::${var.state_bucket_name}"]
  }

  statement {
    sid    = "ReadWriteStateObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = var.state_key_prefix != "" ? [
      "arn:aws:s3:::${var.state_bucket_name}/${var.state_key_prefix}*"
      ] : [
      "arn:aws:s3:::${var.state_bucket_name}/*"
    ]
  }
}

resource "aws_iam_role_policy" "state_access" {
  name   = "${local.name_prefix}-terraform-state"
  role   = aws_iam_role.terraform_apply.id
  policy = data.aws_iam_policy_document.state_access.json
}

resource "aws_iam_role_policy_attachment" "administrator_access" {
  count = var.grant_administrator_access ? 1 : 0

  role       = aws_iam_role.terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

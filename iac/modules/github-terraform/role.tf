resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_oidc_provider ? 1 : 0

  url             = "https://${local.oidc_hostname}"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = merge(local.common_tags, {
    Name = "github-actions-oidc"
  })
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    sid     = "GitHubActionsTerraformApply"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_hostname}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_hostname}:sub"
      values   = [local.allowed_subject]
    }
  }
}

resource "aws_iam_role" "terraform_apply" {
  name                 = "${local.name_prefix}-github-terraform-apply"
  assume_role_policy   = data.aws_iam_policy_document.assume_role.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-github-terraform-apply"
  })
}

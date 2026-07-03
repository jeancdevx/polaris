data "aws_iam_policy_document" "assets" {
  source_policy_documents = [var.assets_bucket_https_policy_json]

  statement {
    sid    = "AllowCloudFrontWebOAC"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::${var.assets_bucket_name}/${var.web_origin_path}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.web.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = var.assets_bucket_name
  policy = data.aws_iam_policy_document.assets.json

  depends_on = [aws_cloudfront_distribution.web]
}

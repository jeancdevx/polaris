data "aws_iam_policy_document" "eventbridge_publish" {
  statement {
    effect = "Allow"
    actions = [
      "events:PutEvents"
    ]
    resources = [
      "arn:aws:events:${local.region}:${local.account_id}:event-bus/${var.eventbridge_bus_name}"
    ]
  }
}

resource "aws_iam_policy" "eventbridge_publish" {
  name_prefix = "${local.name_prefix}-eventbridge-publish-"
  description = "Publish domain events to the custom EventBridge bus"
  policy      = data.aws_iam_policy_document.eventbridge_publish.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eventbridge-publish-policy"
  })
}

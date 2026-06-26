data "aws_iam_policy_document" "msk_client" {
  statement {
    effect = "Allow"
    actions = [
      "kafka-cluster:Connect",
      "kafka-cluster:DescribeCluster"
    ]
    resources = [local.msk_cluster_resource]
  }

  statement {
    effect = "Allow"
    actions = [
      "kafka-cluster:CreateTopic",
      "kafka-cluster:DescribeTopic",
      "kafka-cluster:AlterTopic",
      "kafka-cluster:DeleteTopic",
      "kafka-cluster:ReadData",
      "kafka-cluster:WriteData"
    ]
    resources = [local.msk_topic_resource]
  }

  statement {
    effect = "Allow"
    actions = [
      "kafka-cluster:AlterGroup",
      "kafka-cluster:DescribeGroup"
    ]
    resources = [local.msk_group_resource]
  }
}

resource "aws_iam_policy" "msk_client" {
  name_prefix = "${local.name_prefix}-msk-client-"
  description = "MSK IAM SASL client access for ECS tasks and Lambda functions"
  policy      = data.aws_iam_policy_document.msk_client.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-msk-client-policy"
  })
}

data "aws_iam_policy_document" "msk_topic_admin" {
  statement {
    effect = "Allow"
    actions = [
      "kafka-cluster:Connect",
      "kafka-cluster:DescribeCluster",
      "kafka-cluster:AlterCluster"
    ]
    resources = [local.msk_cluster_resource]
  }

  statement {
    effect = "Allow"
    actions = [
      "kafka-cluster:CreateTopic",
      "kafka-cluster:DescribeTopic",
      "kafka-cluster:AlterTopic",
      "kafka-cluster:DeleteTopic"
    ]
    resources = [local.msk_topic_resource]
  }
}

resource "aws_iam_policy" "msk_topic_admin" {
  name_prefix = "${local.name_prefix}-msk-topic-admin-"
  description = "MSK topic administration for kafka-topic-creator Lambda"
  policy      = data.aws_iam_policy_document.msk_topic_admin.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-msk-topic-admin-policy"
  })
}

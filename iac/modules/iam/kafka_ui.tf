resource "aws_iam_role" "kafka_ui_task" {
  name = "${local.name}-kafka-ui-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "kafka_ui_msk" {
  name = "${local.name}-kafka-ui-msk"
  role = aws_iam_role.kafka_ui_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:Connect",
          "kafka-cluster:DescribeCluster",
          "kafka-cluster:DescribeTopic",
          "kafka-cluster:ListTopics",
          "kafka-cluster:DescribeGroup",
          "kafka-cluster:ListGroups",
          "kafka-cluster:DescribeClusterConfig",
          "kafka-cluster:AlterClusterConfig"
        ]
        Resource = var.kafka_cluster_arn
      },
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:*Topic*",
          "kafka-cluster:ReadData",
          "kafka-cluster:WriteData"
        ]
        Resource = "arn:aws:kafka:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:topic/${var.kafka_cluster_name}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:AlterGroup",
          "kafka-cluster:DescribeGroup"
        ]
        Resource = "arn:aws:kafka:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:group/${var.kafka_cluster_name}/*"
      }
    ]
  })
}

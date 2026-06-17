resource "aws_iam_role" "lambda" {
  for_each = var.lambda_functions

  name = "${local.name}-${each.value.function_name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name     = "${local.name}-${each.value.function_name}"
    Function = each.value.function_name
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  for_each = var.lambda_functions

  role       = aws_iam_role.lambda[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  for_each = { for k, v in var.lambda_functions : k => v if v.vpc_enabled }

  role       = aws_iam_role.lambda[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_secrets" {
  for_each = { for k, v in var.lambda_functions : k => v if length(v.secrets) > 0 }

  name = "${local.name}-${each.value.function_name}-secrets"
  role = aws_iam_role.lambda[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = values(each.value.secrets)
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_kafka" {
  for_each = { for k, v in var.lambda_functions : k => v if v.kafka_enabled }

  name = "${local.name}-${each.value.function_name}-kafka"
  role = aws_iam_role.lambda[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:Connect",
          "kafka-cluster:DescribeTopic",
          "kafka-cluster:ReadData",
          "kafka-cluster:DescribeGroup"
        ]
        Resource = var.kafka_cluster_arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  for_each = { for k, v in var.lambda_functions : k => v if v.dynamodb_enabled }

  name = "${local.name}-${each.value.function_name}-dynamodb"
  role = aws_iam_role.lambda[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_s3" {
  for_each = { for k, v in var.lambda_functions : k => v if v.s3_enabled }

  name = "${local.name}-${each.value.function_name}-s3"
  role = aws_iam_role.lambda[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = concat(
          each.value.s3_bucket_arns,
          [for arn in each.value.s3_bucket_arns : "${arn}/*"]
        )
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_sns" {
  for_each = { for k, v in var.lambda_functions : k => v if v.sns_enabled }

  name = "${local.name}-${each.value.function_name}-sns"
  role = aws_iam_role.lambda[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = each.value.sns_topic_arns
      }
    ]
  })
}

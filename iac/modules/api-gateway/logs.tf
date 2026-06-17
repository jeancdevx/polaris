# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "public_api" {
  name              = "/aws/apigateway/${local.name}-public-api"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "private_api" {
  name              = "/aws/apigateway/${local.name}-private-api"
  retention_in_days = 30

  tags = local.common_tags
}

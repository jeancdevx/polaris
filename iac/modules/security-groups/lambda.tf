resource "aws_security_group" "lambda" {
  for_each = { for k, v in var.lambda_functions : k => v if v.vpc_enabled }

  name_prefix = "${local.name}-${each.value.function_name}-"
  vpc_id      = var.vpc_id

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name     = "${local.name}-${each.value.function_name}-sg"
    Function = each.value.function_name
  })
}

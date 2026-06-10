resource "aws_vpc_endpoint" "gateway" {
  for_each = toset([
    for s in var.vpc_endpoint_services : s
    if contains(["s3", "dynamodb"], s)
  ])

  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.region}.${each.key}"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id,
    aws_route_table.data[*].id
  )

  tags = merge(local.common_tags, {
    Name = "${local.name}-${each.key}-endpoint"
  })
}

resource "aws_vpc_endpoint" "interface" {
  for_each = toset([
    for s in var.vpc_endpoint_services : s
    if !contains(["s3", "dynamodb"], s)
  ])

  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.region}.${each.key}"
  vpc_endpoint_type = "Interface"

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name}-${each.key}-endpoint"
  })
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway && !var.single_nat_gateway ? local.az_count : 1
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name}-nat-eip-${var.single_nat_gateway ? "single" : var.azs[count.index]}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.az_count) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name}-nat-${var.single_nat_gateway ? "single" : var.azs[count.index]}"
  })

  depends_on = [aws_internet_gateway.main]
}

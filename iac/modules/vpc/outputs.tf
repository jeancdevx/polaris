output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "data_subnet_ids" {
  description = "List of data subnet IDs"
  value       = aws_subnet.data[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}

output "data_route_table_ids" {
  description = "List of data route table IDs"
  value       = aws_route_table.data[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "vpc_endpoint_ids" {
  description = "Map of VPC endpoint IDs"
  value = merge(
    { for k, v in aws_vpc_endpoint.gateway : k => v.id },
    { for k, v in aws_vpc_endpoint.interface : k => v.id }
  )
}

output "execute_api_endpoint_id" {
  description = "ID of the execute-api VPC endpoint"
  value       = var.create_api_gateway_endpoint ? aws_vpc_endpoint.execute_api[0].id : null
}

output "execute_api_endpoint_dns" {
  description = "DNS name of the execute-api VPC endpoint"
  value       = var.create_api_gateway_endpoint ? aws_vpc_endpoint.execute_api[0].dns_entry[0].dns_name : null
}

output "vpc_endpoint_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

output "availability_zones" {
  description = "Availability zones used by the VPC module"
  value       = local.availability_zones
}

output "data_subnet_arns" {
  description = "ARNs of data tier subnets"
  value       = [for subnet in aws_subnet.data : subnet.arn]
}

output "data_subnet_ids" {
  description = "IDs of data tier subnets"
  value       = [for subnet in aws_subnet.data : subnet.id]
}

output "internet_gateway_id" {
  description = "ID of the internet gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of NAT gateways"
  value       = [for nat_gateway in aws_nat_gateway.main : nat_gateway.id]
}

output "private_subnet_arns" {
  description = "ARNs of private tier subnets"
  value       = [for subnet in aws_subnet.private : subnet.arn]
}

output "private_subnet_ids" {
  description = "IDs of private tier subnets"
  value       = [for subnet in aws_subnet.private : subnet.id]
}

output "public_subnet_arns" {
  description = "ARNs of public tier subnets"
  value       = [for subnet in aws_subnet.public : subnet.arn]
}

output "public_subnet_ids" {
  description = "IDs of public tier subnets"
  value       = [for subnet in aws_subnet.public : subnet.id]
}

output "route_table_ids" {
  description = "Route table IDs for public, private, and data tiers"
  value = {
    data    = aws_route_table.data.id
    private = { for key, route_table in aws_route_table.private : key => route_table.id }
    public  = aws_route_table.public.id
  }
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "execute_api_vpc_endpoint_id" {
  description = "Interface VPC endpoint ID for API Gateway execute-api"
  value       = var.enable_vpc_endpoints ? aws_vpc_endpoint.interface["execute_api"].id : null
}

output "vpc_endpoint_security_group_id" {
  description = "Security group ID attached to interface VPC endpoints"
  value       = var.enable_vpc_endpoints ? aws_security_group.endpoint[0].id : null
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

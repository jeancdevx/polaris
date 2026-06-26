output "availability_zones" {
  description = "Availability zones used by the VPC"
  value       = module.vpc.availability_zones
}

output "data_subnet_ids" {
  description = "Data tier subnet IDs"
  value       = module.vpc.data_subnet_ids
}

output "private_subnet_ids" {
  description = "Private tier subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public tier subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

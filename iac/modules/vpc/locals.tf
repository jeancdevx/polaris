locals {
  name_prefix = "${var.project_name}-${var.environment}"

  availability_zones = length(var.availability_zones) > 0 ? var.availability_zones : slice(
    data.aws_availability_zones.available.names,
    0,
    var.az_count
  )

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "vpc"
    }
  )

  public_subnets = {
    for index, cidr in var.public_subnet_cidrs : local.availability_zones[index] => {
      cidr = cidr
      az   = local.availability_zones[index]
    }
  }

  private_subnets = {
    for index, cidr in var.private_subnet_cidrs : local.availability_zones[index] => {
      cidr = cidr
      az   = local.availability_zones[index]
    }
  }

  data_subnets = {
    for index, cidr in var.data_subnet_cidrs : local.availability_zones[index] => {
      cidr = cidr
      az   = local.availability_zones[index]
    }
  }

  nat_gateway_keys = var.single_nat_gateway ? {
    for az in [local.availability_zones[0]] : az => local.public_subnets[az]
  } : local.public_subnets

  private_route_table_keys = var.single_nat_gateway ? toset(["shared"]) : toset(local.availability_zones)

  route_table_ids = concat(
    [aws_route_table.public.id],
    [for route_table in aws_route_table.private : route_table.id],
    [aws_route_table.data.id]
  )

  interface_endpoint_services = {
    ecr_api        = "ecr.api"
    ecr_dkr        = "ecr.dkr"
    kms            = "kms"
    logs           = "logs"
    secretsmanager = "secretsmanager"
    sts            = "sts"
  }
}

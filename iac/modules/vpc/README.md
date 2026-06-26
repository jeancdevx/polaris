# VPC module

Red de tres capas para Polaris según `docs/arquitectura.md` sección 4.

## Recursos

| Archivo        | Responsabilidad                      |
| -------------- | ------------------------------------ |
| `vpc.tf`       | VPC + Internet Gateway               |
| `subnets.tf`   | Subnets public, private, data (3 AZ) |
| `nat.tf`       | Elastic IPs + NAT Gateway(s)         |
| `routes.tf`    | Route tables y asociaciones          |
| `endpoints.tf` | VPC endpoints (gateway + interface)  |

## Topología

```
VPC 10.0.0.0/16
├── Public   10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24   → ALB, NAT
├── Private  10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24 → ECS, Lambda
└── Data     10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24 → RDS, Redis, MSK
```

- **NAT:** `single_nat_gateway = true` en dev (default); uno por AZ en prod.
- **Data tier:** sin ruta a internet; solo tráfico local VPC.
- **Endpoints gateway:** S3, DynamoDB.
- **Endpoints interface (private subnets):** ECR API/DKR, CloudWatch Logs, STS,
  Secrets Manager, KMS.

## Uso

```hcl
module "vpc" {
  source = "../../modules/vpc"

  project_name       = "polaris"
  environment        = "dev"
  aws_region         = "us-east-2"
  single_nat_gateway = true
}
```

## Outputs principales

- `vpc_id`, `vpc_cidr_block`
- `public_subnet_ids`, `private_subnet_ids`, `data_subnet_ids`
- `nat_gateway_ids`, `route_table_ids`
- `vpc_endpoint_security_group_id`

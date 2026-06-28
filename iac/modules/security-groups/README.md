# Security groups module

Grupos de seguridad centralizados para Polaris. Solo depende de `vpc_id` y
`vpc_cidr_block`; los módulos de datos (`rds`, `redis`, `kafka`) consumen los
IDs de salida sin referencias cruzadas inversas.

## Archivos

| Archivo     | Responsabilidad                                          |
| ----------- | -------------------------------------------------------- |
| `alb.tf`    | ALB (subnets públicas)                                   |
| `ecs.tf`    | ECS Fargate (subnets privadas)                           |
| `lambda.tf` | Lambda en VPC                                            |
| `rds.tf`    | Aurora PostgreSQL                                        |
| `redis.tf`  | ElastiCache Redis                                        |
| `msk.tf`    | Amazon MSK                                               |
| `rules.tf`  | Reglas `aws_security_group_rule` (evita ciclos entre SG) |

## Matriz de tráfico

| Origen    | Destino | Puerto              |
| --------- | ------- | ------------------- |
| VPC CIDR  | ALB     | 80, 443             |
| ALB SG    | ECS     | 3001 (configurable) |
| ECS SG    | RDS     | 5432                |
| Lambda SG | RDS     | 5432                |
| ECS SG    | Redis   | 6379                |
| Lambda SG | Redis   | 6379                |
| ECS SG    | MSK     | 9098 (IAM SASL)     |
| Lambda SG | MSK     | 9098                |
| MSK SG    | MSK SG  | all (inter-broker)  |

**Egress Lambda:** los SG creados vía Terraform no incluyen egress implícito.
Reglas explícitas en `rules.tf`:

| Lambda SG → | Puerto | Uso                                          |
| ----------- | ------ | -------------------------------------------- |
| VPC CIDR    | 443    | Interface endpoints (STS para MSK IAM, Logs) |
| MSK SG      | 9098   | Cliente Kafka                                |
| RDS SG      | 5432   | Lambdas con Aurora                           |
| Redis SG    | 6379   | Lambdas con cache                            |

ALB acepta tráfico desde el CIDR de la VPC (API Gateway VPC Link en Fase 3).

## Uso

```hcl
module "security_groups" {
  source = "../../modules/security-groups"

  project_name   = "polaris"
  environment    = "dev"
  vpc_id         = module.vpc.vpc_id
  vpc_cidr_block = module.vpc.vpc_cidr_block
}
```

## Outputs

- `alb_security_group_id`, `ecs_security_group_id`, `lambda_security_group_id`
- `rds_security_group_id`, `redis_security_group_id`, `msk_security_group_id`
- `security_group_ids` (mapa completo)

# API Gateway module

HTTP API pública (v2) con VPC Link → **ALB interno** → `api-service`.

El ALB debe ser `internal = true` en subnets privadas. Un ALB internet-facing
provoca `503 Service Unavailable` en la integración VPC Link.

## Fase 3.6

| Ruta                        | Auth en API GW | Backend     |
| --------------------------- | -------------- | ----------- |
| `GET /health`               | No             | api-service |
| `POST /auth/signin`         | No             | api-service |
| `POST /auth/refresh`        | No             | api-service |
| `POST /auth/logout`         | No             | api-service |
| `GET /parking/availability` | No             | api-service |

JWT authorizer (Cognito) se añade en Fase 4 para rutas protegidas (`/user/*`,
reservas).

## Archivos

| Archivo             | Responsabilidad                    |
| ------------------- | ---------------------------------- |
| `api.tf`            | HTTP API + stage `$default`        |
| `vpc-link.tf`       | VPC link en subnets privadas       |
| `integration.tf`    | Integración HTTP_PROXY al listener |
| `routes-auth.tf`    | Rutas auth                         |
| `routes-parking.tf` | Rutas parking                      |

## Uso

```hcl
module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name = "polaris"
  environment  = "dev"

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  vpc_link_security_group_id = module.security_groups.vpc_link_security_group_id
  alb_listener_arn   = module.ecs.alb_listener_arn
}
```

## Verificación

```bash
API=$(terraform output -raw api_gateway_endpoint)
curl -s "${API}health"
curl -s "${API}parking/availability"
```

## Outputs

- `api_endpoint` — URL pública
  (`https://{id}.execute-api.{region}.amazonaws.com/`)
- `api_id`, `vpc_link_id`

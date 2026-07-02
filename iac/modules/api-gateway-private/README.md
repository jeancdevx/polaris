# API Gateway private module

HTTP API v2 **solo invocable vía VPC endpoint**
(`disable_execute_api_endpoint = true`) con el mismo patrón que el API público:
**VPC Link v2 → listener del ALB interno**.

No usa NLB ni REST API v1.

## Rutas

| Ruta                     | Auth                    | Backend                            |
| ------------------------ | ----------------------- | ---------------------------------- |
| `ANY /admin/{proxy+}`    | Cognito JWT             | ALB → `admin-service` (`/admin/*`) |
| `ANY /internal/{proxy+}` | Ninguna (perímetro VPC) | ALB → servicios internos           |

## Archivos

| Archivo              | Responsabilidad             |
| -------------------- | --------------------------- |
| `api.tf`             | HTTP API + stage `$default` |
| `integration.tf`     | VPC Link v2 → ALB listener  |
| `authorizer.tf`      | JWT Cognito para `/admin`   |
| `routes-admin.tf`    | Proxy `/admin/{proxy+}`     |
| `routes-internal.tf` | Proxy `/internal/{proxy+}`  |

## Uso

Reutiliza el VPC Link del API público:

```hcl
module "api_gateway_private" {
  source = "../../modules/api-gateway-private"

  project_name = "polaris"
  environment  = "dev"

  execute_api_vpc_endpoint_id = module.vpc.execute_api_vpc_endpoint_id
  vpc_link_id                 = module.api_gateway.vpc_link_id
  alb_listener_arn            = module.ecs.alb_listener_arn

  cognito_app_client_id = module.cognito.app_client_id
  cognito_issuer_url    = module.cognito.issuer_url
}
```

## URL de invocación

```
https://{api-id}-{vpce-id}.execute-api.{region}.amazonaws.com/admin/users
```

## Outputs

- `api_endpoint` — URL privada vía VPC endpoint
- `api_id`, `integration_id`

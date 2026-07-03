# API Gateway admin module (`api-gateway-private`)

HTTP API v2 **separada de la API pública** (mobile, reservas, etc.) con el mismo
patrón de integración: **VPC Link v2 → listener del ALB interno**.

No es una API Gateway “private” de AWS (sin invocación exclusiva por VPC
endpoint). En staging/prod el único entrypoint público es CloudFront
(`admin-api.*`) con WAF + header `X-Origin-Verify`.

## Rutas

| Ruta                     | Auth                  | Backend                            |
| ------------------------ | --------------------- | ---------------------------------- |
| `ANY /admin/{proxy+}`    | Cognito JWT           | ALB → `admin-service` (`/admin/*`) |
| `ANY /internal/{proxy+}` | Ninguna (uso interno) | ALB → servicios internos           |

En staging/prod, el WAF del edge **bloquea `/internal`** en el dominio público;
esas rutas siguen disponibles en dev vía `execute-api` o desde la VPC.

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
  environment  = "staging"

  disable_execute_api_endpoint = true

  vpc_link_id      = module.api_gateway.vpc_link_id
  alb_listener_arn = module.ecs.alb_listener_arn

  cognito_app_client_id = module.cognito.app_client_id
  cognito_issuer_url    = module.cognito.issuer_url
}
```

## URL de invocación

- **Dev** (`disable_execute_api_endpoint = false`):
  `https://{api-id}.execute-api.{region}.amazonaws.com/admin/...`
- **Staging/prod** (edge): `https://admin-api.galaxymorph.com/admin/...`

## Outputs

- `api_endpoint` — URL `execute-api` cuando está habilitada; `null` si solo edge
- `api_id`, `api_stage_name`, `integration_id`

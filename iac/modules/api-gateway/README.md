# API Gateway module

HTTP API pública (v2) con VPC Link → **ALB interno** → `api-service` /
`reservation-service`.

El ALB debe ser `internal = true` en subnets privadas. Un ALB internet-facing
provoca `503 Service Unavailable` en la integración VPC Link.

## Rutas

| Ruta                           | Auth JWT | Backend             |
| ------------------------------ | -------- | ------------------- |
| `GET /health`                  | No       | api-service         |
| `POST /auth/signin`            | No       | api-service         |
| `POST /auth/refresh`           | No       | api-service         |
| `POST /auth/logout`            | No       | api-service         |
| `GET /parking/availability`    | No       | api-service         |
| `POST /parking/reserve`        | Sí       | reservation-service |
| `DELETE /parking/reserve/{id}` | Sí       | reservation-service |

Rutas protegidas: authorizer Cognito JWT. El **idToken** debe incluir
`preferred_username` (p. ej. `usr-12345`). Los claims con `:` (como `custom:*`)
no son válidos en parameter mapping de HTTP API.

**Identidad en reservation-service:** el mapping `append:header.x-user-id` no es
fiable con VPC Link → ALB. El servicio usa `preferred_username` del Bearer token
(coincide con la app móvil). El header `X-User-Id` solo aplica en pruebas
directas contra el ALB sin JWT.

### Troubleshooting `X-User-Id header is required`

1. Usar **idToken**, no accessToken (`jq -r .idToken`).
2. Verificar `preferred_username` en el payload del JWT.
3. Redeploy `reservation-service` tras cambios de identidad.
4. Prueba manual `-H "X-User-Id: usr-12345"` confirma routing; error RDS indica
   falta de migraciones/seed.

## Archivos

| Archivo                 | Responsabilidad                      |
| ----------------------- | ------------------------------------ |
| `api.tf`                | HTTP API + stage `$default`          |
| `authorizer.tf`         | JWT authorizer Cognito               |
| `vpc-link.tf`           | VPC link en subnets privadas         |
| `integration.tf`        | Integraciones HTTP_PROXY al listener |
| `routes-auth.tf`        | Rutas auth + health                  |
| `routes-parking.tf`     | Disponibilidad parking               |
| `routes-reservation.tf` | Reservas (JWT)                       |

## Uso

```hcl
module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name = "polaris"
  environment  = "dev"

  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  vpc_link_security_group_id = module.security_groups.vpc_link_security_group_id
  alb_listener_arn           = module.ecs.alb_listener_arn

  cognito_app_client_id = module.cognito.app_client_id
  cognito_issuer_url      = module.cognito.issuer_url
}
```

## Verificación E2E (4.5)

Requiere `preferred_username` en Cognito (mapea a `usr-*` del seed). Usar
**idToken**:

```bash
POOL=$(terraform output -raw cognito_user_pool_id)

aws cognito-idp admin-update-user-attributes \
  --user-pool-id "$POOL" \
  --username "juan@example.com" \
  --user-attributes Name=preferred_username,Value=usr-12345 \
  --region us-east-2

TOKEN=$(curl -s -X POST "${API}auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"YOUR_PASSWORD"}' \
  | jq -r .idToken)

curl -s -X POST "${API}parking/reserve" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"parkingSpotId":"spot-07","reservationDate":"2025-06-19T14:00:00.000Z"}'
```

## Outputs

- `api_endpoint` — URL pública
- `api_id`, `vpc_link_id`

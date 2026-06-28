# Cognito module

Amazon Cognito User Pool para identidades de app móvil/web, según
`docs/arquitectura.md` secciones 5 y 13.

## Recursos

| Archivo         | Responsabilidad                             |
| --------------- | ------------------------------------------- |
| `user-pool.tf`  | User Pool (email como username)             |
| `app-client.tf` | App client público (SRP, password, refresh) |
| `domain.tf`     | Hosted UI domain (opcional)                 |
| `groups.tf`     | Grupos `admin` y `user`                     |

## Configuración por entorno

| Entorno          | MFA      | Deletion protection | Dominio hosted UI                    |
| ---------------- | -------- | ------------------- | ------------------------------------ |
| **dev**          | OFF      | off                 | opcional (`create_user_pool_domain`) |
| **staging/prod** | OPTIONAL | prod on             | opcional                             |

MFA opcional para admins (arquitectura): habilitado fuera de dev; los admins
pueden activar TOTP en Cognito.

## Flujos soportados (Fase 3)

El app client expone flujos para `api-service`:

- Sign up / sign in (`ALLOW_USER_PASSWORD_AUTH`, `ALLOW_USER_SRP_AUTH`)
- Refresh (`ALLOW_REFRESH_TOKEN_AUTH`)
- JWT para API Gateway HTTP API authorizer

## Uso

```hcl
module "cognito" {
  source = "../../modules/cognito"

  project_name = "polaris"
  environment  = "dev"
}
```

## Outputs clave

- `user_pool_id`, `user_pool_arn`
- `app_client_id`
- `issuer_url`, `jwks_uri` — validación JWT en API Gateway / NestJS
- `user_group_names`

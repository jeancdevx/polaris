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

| Entorno          | MFA      | Deletion protection | Alta usuarios                         |
| ---------------- | -------- | ------------------- | ------------------------------------- |
| **dev**          | OFF      | off                 | solo admin (`admin_create_user_only`) |
| **staging/prod** | OPTIONAL | prod on             | solo admin                            |

MFA opcional para admins (arquitectura): habilitado fuera de dev; los admins
pueden activar TOTP en Cognito.

## Flujos soportados

| Actor                                 | Flujo                                                          |
| ------------------------------------- | -------------------------------------------------------------- |
| **Usuario final** (`api-service`)     | Sign in, refresh, logout — cuenta creada previamente por admin |
| **Admin** (`admin-service`, Flujo 20) | `AdminCreateUser` + grupo `user`/`admin` + RDS + RFID          |

El app client expone para `api-service`:

- Sign in (`ALLOW_USER_PASSWORD_AUTH`, `ALLOW_USER_SRP_AUTH`)
- Refresh (`ALLOW_REFRESH_TOKEN_AUTH`) El app client lee `preferred_username`
  (p. ej. `usr-12345`) para el authorizer JWT de API Gateway en rutas de
  reserva. Asignar con `admin-update-user-attributes` al crear usuarios hasta
  Flujo 20 (`admin-service`).

**No hay signup público** — `allow_admin_create_user_only = true`.

## Uso

```hcl
module "cognito" {
  source = "../../modules/cognito"

  project_name             = "polaris"
  environment              = "dev"
  admin_create_user_only   = true
}
```

## Outputs clave

- `user_pool_id`, `user_pool_arn`
- `app_client_id`
- `issuer_url`, `jwks_uri` — validación JWT en API Gateway / NestJS
- `user_group_names`

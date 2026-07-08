# web-admin

Panel Next.js + shadcn/ui para operadores admin: ocupación en vivo (AppSync),
gestión de usuarios, auditoría, alertas y métricas (REST vía BFF →
`admin-service`).

## Stack UI

- [shadcn/ui](https://ui.shadcn.com) preset **Lyra** (radix, neutral)
- Sidebar layout, tablas, formularios con `Field`, diálogos de confirmación
- Iconos: `@phosphor-icons/react`

## Requisitos

- Infra dev desplegada (`appsync`, `cognito`)
- Usuario Cognito en el grupo `admin`
- `admin-service` accesible (local o túnel hacia la API privada en VPC)

## Configuración local

```bash
bash scripts/web-admin-env-dev.sh
```

Genera `apps/web-admin/.env.local` desde outputs de Terraform.
`NEXT_PUBLIC_ADMIN_API_URL` apunta al API Gateway **admin** en AWS.

```bash
pnpm web-admin:env:dev
```

## Desarrollo

Una sola terminal (REST admin vía API GW en AWS):

```bash
pnpm --filter web-admin dev       # UI en :3000
```

Abrir `http://localhost:3000/dashboard`.

## Rutas

| Ruta         | Módulo                                             |
| ------------ | -------------------------------------------------- |
| `/dashboard` | Ocupación + anomalías (naranja) + detalle de plaza |
| `/alerts`    | Alertas operativas (24 h)                          |
| `/users`     | CRUD usuarios                                      |
| `/audit`     | Logs de auditoría                                  |
| `/metrics`   | Agregados históricos                               |

## Build

```bash
pnpm --filter web-admin build        # servidor Next (local)
pnpm --filter web-admin build:static # export estático → out/ (S3 + CloudFront)
pnpm --filter web-admin start
```

### Deploy estático (S3 + CloudFront)

En **staging/prod** la UI se sirve desde CloudFront + S3 (`web-admin/` en el
bucket assets). El build usa `output: 'export'`; las llamadas REST van directo
al API Gateway admin desde el navegador (`NEXT_PUBLIC_ADMIN_API_URL`), no hay
BFF en producción.

Variables de entorno del build (ver `.env.example`):

| Variable                                          | Uso                                                       |
| ------------------------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_ADMIN_API_URL`                       | API Gateway admin (CORS debe incluir el origen de la web) |
| `NEXT_PUBLIC_APPSYNC_*` / `NEXT_PUBLIC_COGNITO_*` | Ocupación en vivo                                         |

CI: workflows `deploy-web-admin-dev.yml` (rama `develop`) y
`deploy-web-admin-production.yml` (rama `production`) cuando cambia
`apps/web-admin/**`. Configura en el GitHub Environment:

- `NEXT_PUBLIC_ADMIN_API_URL`, `NEXT_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT`,
  `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `WEB_ADMIN_S3_BUCKET` (opcional; default `polaris-assets-{env}-{account}`)
- `WEB_CLOUDFRONT_DISTRIBUTION_ID` (staging/prod; omitir en dev)

Deploy manual:

```bash
pnpm web-admin:env:dev   # genera .env.local con URLs de dev
set -a && source apps/web-admin/.env.local && set +a
bash scripts/deploy-web-admin.sh dev
```

## Arquitectura

| Capa              | Uso                                                                              |
| ----------------- | -------------------------------------------------------------------------------- |
| AppSync + Cognito | Ocupación (`Query.availability`, `Subscription.onOccupancyChanged`)              |
| API Gateway admin | REST directo desde el browser (`/admin/users`, `/admin/audit`, `/admin/metrics`) |
| `admin-service`   | Backend detrás del API Gateway privado                                           |

## Añadir componentes shadcn

```bash
cd apps/web-admin
pnpm dlx shadcn@latest add <component>
```

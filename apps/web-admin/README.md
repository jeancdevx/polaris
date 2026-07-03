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

Genera `apps/web-admin/.env.local` desde outputs de Terraform y define
`ADMIN_API_URL=http://127.0.0.1:3004` para el proxy BFF.

## Desarrollo

En dos terminales:

```bash
pnpm dev --filter admin-service   # REST en :3004
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
pnpm --filter web-admin build
pnpm --filter web-admin start
```

## Arquitectura

| Capa                 | Uso                                                                           |
| -------------------- | ----------------------------------------------------------------------------- |
| AppSync + Cognito    | Ocupación (`Query.availability`, `Subscription.onOccupancyChanged`)           |
| `/api/admin/*` (BFF) | Proxy server-side hacia `ADMIN_API_URL` con `Authorization: Bearer` (idToken) |
| `admin-service`      | `/admin/users`, `/admin/audit`, `/admin/metrics`                              |

## Añadir componentes shadcn

```bash
cd apps/web-admin
pnpm dlx shadcn@latest add <component>
```

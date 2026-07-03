# web-admin

Panel Next.js + Tailwind CSS para operadores admin. Consulta
`Query.availability` y escucha `Subscription.onOccupancyChanged` vía AppSync con
auth Cognito (grupo `admin`).

## Requisitos

- Infra dev desplegada (`appsync`, `cognito`)
- Usuario Cognito en el grupo `admin`

## Configuración local

```bash
bash scripts/web-admin-env-dev.sh
```

Genera `apps/web-admin/.env.local` desde outputs de Terraform.

## Desarrollo

```bash
pnpm install
pnpm --filter web-admin dev
```

Abrir `http://localhost:3000/dashboard`.

## Build

```bash
pnpm --filter web-admin build
pnpm --filter web-admin start
```

## AppSync

- Query inicial: ocupación completa (Redis → RDS fallback en backend)
- Subscription: actualiza plazas en tiempo real cuando EventBridge publica
  `sensor.occupancy` → `appsync-occupancy-publisher`

## Smoke manual

1. Login con usuario admin.
2. Verificar totales y mapa por zonas A/B.
3. Disparar un cambio de ocupación (`pnpm appsync:subscription:smoke:dev` o
   sensor real) y confirmar que la plaza cambia sin recargar.

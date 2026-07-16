# @polaris/database

Persistencia PostgreSQL con TypeORM para Polaris.

## Tablas

| Tabla              | Descripción                                    |
| ------------------ | ---------------------------------------------- |
| `users`            | Usuarios registrados y admins                  |
| `parking_spots`    | 10 plazas (spot-01 … spot-10)                  |
| `reservations`     | Reservas con ciclo de vida completo            |
| `rfid_tags`        | Tags RFID vinculados a usuarios                |
| `parking_sessions` | Sesiones walk-in (entrada/salida sin reserva)  |
| `audit_logs`       | Eventos de auditoría                           |
| `sensor_data`      | Telemetría local (complementa DynamoDB en AWS) |

Las entidades usan **EntitySchema** (sin clases de dominio) — la capa ORM es
independiente de `@polaris/domain`.

## Requisitos

Postgres local vía Docker:

```bash
docker compose -f infra/local/docker-compose.yml up -d postgres
```

Variables (ver `infra/local/.env.example`):

```
DATABASE_URL=postgresql://parking_admin:parking_dev@localhost:5432/parking_db
```

En Lambdas, `createDataSourceAsync()` obtiene `username` y `password` una vez
por cold start desde `DB_SECRET_ARN` y completa las variables `DB_*`. Los
valores no secretos `DB_HOST`, `DB_PORT` y `DB_NAME` se configuran en Terraform.

## Migraciones

```bash
# Aplicar migraciones pendientes
pnpm db:migrate

# Revertir la última migración
pnpm db:migrate:revert

# Ver estado
pnpm --filter @polaris/database migration:show
```

## Seed (datos de desarrollo)

Requiere migraciones aplicadas y Postgres local en marcha.

```bash
pnpm db:seed
```

## Reset dev (solo datos de prueba)

Vacía tablas de aplicación, vuelve a cargar el seed y sincroniza Redis (incluye
borrar claves legacy `parking:*` y `{parking}:*`):

```bash
# Local (Postgres + Redis en docker-compose)
pnpm --filter @polaris/database reset:dev

# AWS dev (task ECS en la VPC)
pnpm db:reset:dev

# O GitHub Actions → DB reset dev → confirm: reset-dev
```

Carga idempotente:

| Recurso      | Cantidad | Detalle                                                   |
| ------------ | -------- | --------------------------------------------------------- |
| Plazas       | 10       | `spot-01` … `spot-10`, estado `free`                      |
| Admin        | 1        | `usr-admin01`, `admin@polaris.local` (sin tarjeta física) |
| Usuario test | 1        | `usr-12345`, `juan@example.com`, RFID `40:62:BD:DC`       |
| Visitantes   | 9        | `usr-card02` … `usr-card10`, una tarjeta física cada uno  |
| RFID tags    | 10       | Las 10 UIDs físicas del banco de pruebas                  |

Los datos de usuario se validan con `@polaris/domain` antes de persistir.

## Build

```bash
pnpm --filter @polaris/database build
```

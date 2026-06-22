# @polaris/database

Persistencia PostgreSQL con TypeORM para Polaris.

## Tablas

| Tabla           | Descripción                                    |
| --------------- | ---------------------------------------------- |
| `users`         | Usuarios registrados y admins                  |
| `parking_spots` | 10 plazas (spot-01 … spot-10)                  |
| `reservations`  | Reservas con ciclo de vida completo            |
| `rfid_tags`     | Tags RFID vinculados a usuarios                |
| `audit_logs`    | Eventos de auditoría                           |
| `sensor_data`   | Telemetría local (complementa DynamoDB en AWS) |

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

## Migraciones

```bash
# Aplicar migraciones pendientes
pnpm db:migrate

# Revertir la última migración
pnpm db:migrate:revert

# Ver estado
pnpm --filter @polaris/database migration:show
```

## Build

```bash
pnpm --filter @polaris/database build
```

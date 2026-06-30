# admin-service

Microservicio NestJS para operaciones administrativas (Fase 6). Puerto **3004**.

## Responsabilidades

### 6.1 — CRUD usuarios

| Método   | Ruta               | Descripción                          |
| -------- | ------------------ | ------------------------------------ |
| `POST`   | `/admin/users`     | Alta Cognito + RDS + RFID + DynamoDB |
| `GET`    | `/admin/users`     | Listado (`?includeInactive=true`)    |
| `GET`    | `/admin/users/:id` | Detalle                              |
| `PUT`    | `/admin/users/:id` | Actualización perfil/rol/estado      |
| `DELETE` | `/admin/users/:id` | Baja lógica + Cognito disable        |

### 6.2 — Auditoría y métricas

| Método | Ruta             | Descripción                                      |
| ------ | ---------------- | ------------------------------------------------ |
| `GET`  | `/admin/audit`   | Logs paginados desde RDS `audit_logs` + filtros  |
| `GET`  | `/admin/metrics` | Ocupación (Redis/RDS), reservas, usuarios, audit |

Todas las rutas requieren JWT con claim `cognito:groups` que incluya `admin`.

#### `GET /admin/audit`

Query params:

| Param           | Descripción                          |
| --------------- | ------------------------------------ |
| `page`, `limit` | Paginación (default 1 / 20, max 100) |
| `eventType`     | Filtro por tipo de evento            |
| `userId`        | Filtro por usuario                   |
| `parkingSpotId` | Filtro por plaza                     |
| `gate`          | Filtro por barrera                   |
| `userType`      | `registered` \| `visitor`            |
| `from`, `to`    | Rango ISO-8601 en `timestamp`        |

#### `GET /admin/metrics`

Query params:

| Param        | Descripción                                 |
| ------------ | ------------------------------------------- |
| `zone`       | `a` \| `b` — filtra ocupación por zona      |
| `from`, `to` | Rango para agregados (default últimas 24 h) |

Respuesta incluye ocupación por zona, reservas activas/canceladas/expiradas,
usuarios activos/inactivos y conteo de audit por `eventType`.

## Desarrollo local

```bash
pnpm install
docker compose -f infra/local/docker-compose.yml up -d postgres redis

pnpm dev --filter admin-service
```

Variables:

| Variable                      | Uso                                 |
| ----------------------------- | ----------------------------------- |
| `DATABASE_URL`                | Aurora / Postgres local             |
| `REDIS_URL`                   | Ocupación en tiempo real (métricas) |
| `COGNITO_USER_POOL_ID`        | Pool para `AdminCreateUser`         |
| `AWS_REGION`                  | Cognito + DynamoDB                  |
| `RFID_VALIDATIONS_TABLE_NAME` | Tabla DynamoDB (opcional en local)  |
| `PORT`                        | Default `3004`                      |

## Tests

```bash
pnpm test --filter admin-service
pnpm test:integration:users
pnpm test:integration:audit
pnpm test:integration:metrics
```

## Roadmap

| Fase | Entrega                        |
| ---- | ------------------------------ |
| 6.1  | Scaffold + CRUD usuarios admin |
| 6.2  | Audit + metrics                |
| 6.6  | API Gateway privado + ECS      |

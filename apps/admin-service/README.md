# admin-service

Microservicio NestJS para operaciones administrativas (Fase 6). Puerto **3004**.

## Responsabilidades (6.1)

CRUD de usuarios admin (`Flujo 20` / `Flujo 21`):

| Método   | Ruta               | Descripción                          |
| -------- | ------------------ | ------------------------------------ |
| `POST`   | `/admin/users`     | Alta Cognito + RDS + RFID + DynamoDB |
| `GET`    | `/admin/users`     | Listado (`?includeInactive=true`)    |
| `GET`    | `/admin/users/:id` | Detalle                              |
| `PUT`    | `/admin/users/:id` | Actualización perfil/rol/estado      |
| `DELETE` | `/admin/users/:id` | Baja lógica + Cognito disable        |

Todas las rutas requieren JWT con claim `cognito:groups` que incluya `admin`.

## Desarrollo local

```bash
pnpm install
docker compose -f infra/local/docker-compose.yml up -d postgres

pnpm dev --filter admin-service
```

Variables:

| Variable                      | Uso                                |
| ----------------------------- | ---------------------------------- |
| `DATABASE_URL`                | Aurora / Postgres local            |
| `COGNITO_USER_POOL_ID`        | Pool para `AdminCreateUser`        |
| `AWS_REGION`                  | Cognito + DynamoDB                 |
| `RFID_VALIDATIONS_TABLE_NAME` | Tabla DynamoDB (opcional en local) |
| `PORT`                        | Default `3004`                     |

## Tests

```bash
pnpm test --filter admin-service
pnpm test:integration:users
```

## Roadmap

| Fase | Entrega                        |
| ---- | ------------------------------ |
| 6.1  | Scaffold + CRUD usuarios admin |
| 6.2  | `GET /admin/audit`, `/metrics` |
| 6.6  | API Gateway privado + ECS      |

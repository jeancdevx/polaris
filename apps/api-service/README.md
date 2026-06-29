# api-service

REST API pública de Polaris (Fase 3). NestJS 11 + Fastify + ESM.

## Desarrollo local

Prerequisito: stack local opcional (`infra/local/docker-compose.yml`).

```bash
pnpm install
pnpm dev --filter api-service
```

Health check:

```bash
curl http://localhost:3001/health
```

Respuesta esperada:

```json
{ "status": "ok", "service": "api-service" }
```

### Auth Cognito (3.2)

Los usuarios **no se auto-registran**. Un admin los da de alta (Flujo 20 →
`admin-service`, Fase 6). `api-service` solo expone **signin / refresh /
logout** para cuentas ya existentes en Cognito.

Configura en `infra/local/.env.local` los outputs del User Pool dev:

```bash
cd iac/environments/dev
terraform output -raw cognito_user_pool_id
terraform output -raw cognito_app_client_id
terraform output -raw cognito_issuer_url
```

| Variable               | Descripción                           |
| ---------------------- | ------------------------------------- |
| `COGNITO_USER_POOL_ID` | User Pool ID                          |
| `COGNITO_CLIENT_ID`    | App client ID (sin secret)            |
| `COGNITO_ISSUER_URL`   | Issuer OIDC (JWT en API GW, fase 3.6) |
| `AWS_REGION`           | Región del User Pool (`us-east-2`)    |

Endpoints:

| Método | Ruta            | Body                                       |
| ------ | --------------- | ------------------------------------------ |
| `POST` | `/auth/signin`  | `{ "email", "password" }`                  |
| `POST` | `/auth/refresh` | `{ "refreshToken" }`                       |
| `POST` | `/auth/logout`  | Bearer `accessToken` o `{ "accessToken" }` |

Ejemplo signin (usuario previamente creado por admin):

```bash
curl -s -X POST http://localhost:3001/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"juan@example.com","password":"..."}'
```

### Disponibilidad (3.3)

`GET /parking/availability` — lectura pública (Flujo 23). Redis primero
(`parking:spot:*`), fallback a Aurora si la caché está fría.

Requiere Postgres + Redis locales (`docker compose up`) y migraciones/seed:

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:sync-redis   # opcional: calienta Redis desde RDS (dev local)
```

```bash
curl -s http://localhost:3001/parking/availability
```

Respuesta tipada con `ParkingStatus` de `@polaris/shared-types`
(`Cache-Control: max-age=30`).

Variables generales (dev): carga automática desde `infra/local/.env.local` vía
`@nestjs/config`.

| Variable       | Descripción                      |
| -------------- | -------------------------------- |
| `DATABASE_URL` | Postgres (fallback RDS)          |
| `REDIS_URL`    | Redis (ocupación en tiempo real) |

| Variable | Default   | Descripción                              |
| -------- | --------- | ---------------------------------------- |
| `PORT`   | `3001`    | Puerto HTTP (3000 reservado al frontend) |
| `HOST`   | `0.0.0.0` | Bind (Docker/ECS)                        |

## Scripts

| Comando                         | Descripción                               |
| ------------------------------- | ----------------------------------------- |
| `pnpm dev`                      | Nest watch mode                           |
| `pnpm build`                    | Compila a `dist/`                         |
| `pnpm start`                    | Ejecuta `dist/main.js`                    |
| `pnpm test`                     | Vitest (unitarios)                        |
| `pnpm test:integration`         | Integración (auth + parking)              |
| `pnpm test:integration:parking` | Integración availability (testcontainers) |

Desde la raíz del monorepo:

```bash
pnpm test:integration:auth      # Cognito dev (AWS creds)
pnpm test:integration:parking    # Redis + RDS fallback
```

Auth requiere credenciales AWS y `COGNITO_*` en `infra/local/.env.local`.

### Docker (3.4)

Build desde la raíz del monorepo (contexto = repo completo):

```bash
pnpm docker:build:api-service
docker run --rm -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/polaris \
  -e REDIS_URL=redis://host:6379 \
  polaris-api-service:local
curl http://localhost:3001/health
```

Push a ECR dev (requiere AWS CLI + Docker; crea el repo si no existe):

```bash
pnpm docker:push:api-service:dev
# IMAGE_TAG=abc123 pnpm docker:push:api-service:dev
```

Repositorio ECR: `polaris-dev-api-service` (`{project}-{env}-api-service`).

### ECS dev (3.5)

Tras `terraform apply` en `iac/environments/dev`:

```bash
curl -s "http://$(cd iac/environments/dev && terraform output -raw api_service_alb_dns_name)/health"
```

Variables de task: `DATABASE_URL` y `REDIS_URL` desde Secrets Manager;
`COGNITO_*` y `AWS_REGION` como env plain.

## Roadmap

Ver [docs/roadmap.md](../../docs/roadmap.md) Fase 3: ECS (3.5), API Gateway
(3.6).

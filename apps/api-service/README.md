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
| `POST` | `/auth/signup`  | `{ "email", "password" }`                  |
| `POST` | `/auth/signin`  | `{ "email", "password" }`                  |
| `POST` | `/auth/refresh` | `{ "refreshToken" }`                       |
| `POST` | `/auth/logout`  | Bearer `accessToken` o `{ "accessToken" }` |

Ejemplo signin:

```bash
curl -s -X POST http://localhost:3001/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"juan@example.com","password":"..."}'
```

Variables generales (dev): carga automática desde `infra/local/.env.local` vía
`@nestjs/config`.

| Variable | Default   | Descripción                              |
| -------- | --------- | ---------------------------------------- |
| `PORT`   | `3001`    | Puerto HTTP (3000 reservado al frontend) |
| `HOST`   | `0.0.0.0` | Bind (Docker/ECS)                        |

## Scripts

| Comando                 | Descripción                             |
| ----------------------- | --------------------------------------- |
| `pnpm dev`              | Nest watch mode                         |
| `pnpm build`            | Compila a `dist/`                       |
| `pnpm start`            | Ejecuta `dist/main.js`                  |
| `pnpm test`             | Vitest (unitarios)                      |
| `pnpm test:integration` | Integración Cognito dev (User Pool AWS) |

Desde la raíz del monorepo:

```bash
pnpm test:integration:auth
# equivalente:
pnpm --filter api-service test:integration
```

Requiere credenciales AWS y `COGNITO_*` en `infra/local/.env.local`.

## Roadmap

Ver [docs/roadmap.md](../../docs/roadmap.md) Fase 3: availability (3.3), ECS
(3.5).

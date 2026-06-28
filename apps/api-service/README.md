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

Variables de entorno (dev): carga automática desde `infra/local/.env.local` vía
`@nestjs/config`. Opcionales:

| Variable | Default   | Descripción                              |
| -------- | --------- | ---------------------------------------- |
| `PORT`   | `3001`    | Puerto HTTP (3000 reservado al frontend) |
| `HOST`   | `0.0.0.0` | Bind (Docker/ECS)                        |

## Scripts

| Comando      | Descripción            |
| ------------ | ---------------------- |
| `pnpm dev`   | Nest watch mode        |
| `pnpm build` | Compila a `dist/`      |
| `pnpm start` | Ejecuta `dist/main.js` |

## Roadmap

Ver [docs/roadmap.md](../../docs/roadmap.md) Fase 3: auth Cognito (3.2),
availability (3.3), ECS (3.5).

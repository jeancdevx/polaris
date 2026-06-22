# Polaris

Sistema de estacionamiento público IoT sobre AWS — monorepo TypeScript.

## Stack

- **Node.js 24** · **NestJS 11** · **TypeScript 6** · **ESM**
- **Turborepo** · **pnpm** · **Rolldown** · **oxlint** · **Vitest** ·
  **Prettier**
- **Amazon MSK (Kafka)** · ECS Fargate · Aurora · ElastiCache · IoT Core

## Estructura

```
apps/           Microservicios NestJS (ECS)
lambdas/        Funciones Lambda (Node 24)
packages/       Librerías compartidas
firmware/esp32/ Firmware IoT
infra/local/    Docker Compose (Postgres, Redis, Kafka)
iac/bootstrap/  Terraform state remoto
docs/           Arquitectura y roadmap
```

## Documentación

- [Arquitectura](./docs/arquitectura.md)
- [Roadmap](./docs/roadmap.md)

## Inicio rápido

```bash
# Requisitos: Node >= 24, pnpm, Docker

pnpm install
pnpm build
pnpm lint
pnpm test

# Stack local
docker compose -f infra/local/docker-compose.yml up -d
```

## Scripts

| Comando          | Descripción                             |
| ---------------- | --------------------------------------- |
| `pnpm build`     | Build de todos los packages (Turborepo) |
| `pnpm lint`      | oxlint en todo el repo                  |
| `pnpm test`      | Vitest en workspaces                    |
| `pnpm format`    | Prettier                                |
| `pnpm typecheck` | TypeScript                              |

## Fase actual

**Fase 0 completada** — ver [roadmap](./docs/roadmap.md). Siguiente: **Fase 1**
(domain + database).

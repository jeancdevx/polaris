# @polaris/integration-tests

Tests de integración con [Testcontainers](https://node.testcontainers.org/) para
Fase 1.

## Requisitos

- Docker en ejecución (socket accesible)
- `pnpm build` previo (dependencias del workspace compiladas)

## Ejecutar

```bash
pnpm build
pnpm test:integration
```

O como parte de la suite completa:

```bash
pnpm test
```

## Qué valida

| Servicio   | Test                                          |
| ---------- | --------------------------------------------- |
| PostgreSQL | migraciones + seed (`users`, `parking_spots`) |
| Redis      | lectura/escritura de claves de ocupación      |
| Kafka      | publicar/consumir `reservation.created`       |

Los contenedores usan las mismas imágenes base que
`infra/local/docker-compose.yml` donde es posible (`postgres:17.10-alpine`,
`redis:8.6.4-alpine`).

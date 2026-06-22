# Stack local de desarrollo

Servicios que emulan el entorno AWS en tu máquina:

| Servicio         | Puerto | Uso                                        |
| ---------------- | ------ | ------------------------------------------ |
| PostgreSQL 17    | 5432   | RDS Aurora (datos transaccionales)         |
| Redis 7          | 6379   | ElastiCache (estado en tiempo real, locks) |
| Apache Kafka 3.9 | 9092   | Amazon MSK (bus de eventos)                |

## Uso

```bash
docker compose -f infra/local/docker-compose.yml up -d
docker compose -f infra/local/docker-compose.yml ps
docker compose -f infra/local/docker-compose.yml down
```

Los topics de Kafka se crean automáticamente al iniciar (contenedor
`kafka-init`). Los nombres coinciden con `@polaris/shared-types` →
`KAFKA_TOPICS`.

## Variables de entorno sugeridas (`.env.local`)

```env
DATABASE_URL=postgresql://parking_admin:parking_dev@localhost:5432/parking_db
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
AWS_REGION=us-east-2
```

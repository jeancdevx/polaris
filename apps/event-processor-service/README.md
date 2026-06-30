# event-processor-service

Consumidor Kafka de Polaris (Fase 5). NestJS 11 + Fastify + ESM, puerto
**3003**.

Procesa los 8 topics definidos en `@polaris/shared-types` → `KAFKA_TOPICS`.
Handlers de negocio (Fase 5.2): `vehicle.entry`, `vehicle.exit`,
`sensor.occupancy` → actualizan RDS (TypeORM) y Redis. Tras procesar con éxito,
publican en EventBridge (`@polaris/eventbridge`) para orquestación
(audit-logger, notificaciones, etc.).

## Desarrollo local

Prerequisitos: Postgres, Redis y Kafka (`infra/local/docker-compose.yml`).

```bash
pnpm install
docker compose -f infra/local/docker-compose.yml up -d postgres redis kafka-1 kafka-2 kafka-3 kafka-init

pnpm dev --filter event-processor-service
```

Variables (ver `infra/local/.env.local`):

| Variable                  | Default                   | Uso                                       |
| ------------------------- | ------------------------- | ----------------------------------------- |
| `DATABASE_URL`            | —                         | Aurora / Postgres local                   |
| `REDIS_URL`               | `redis://localhost:6379`  | ElastiCache / Redis local                 |
| `KAFKA_BROKERS`           | —                         | Brokers local o MSK                       |
| `KAFKA_AUTH_MODE`         | `plain`                   | `iam` en AWS (MSK SASL)                   |
| `KAFKA_CLIENT_ID`         | `event-processor-service` | Cliente KafkaJS                           |
| `KAFKA_CONSUMER_GROUP_ID` | `event-processor-service` | Consumer group                            |
| `AWS_REGION`              | —                         | Requerido con `KAFKA_AUTH_MODE=iam`       |
| `EVENTBRIDGE_ENABLED`     | `true`                    | `false` desactiva PutEvents (dev sin AWS) |
| `EVENTBRIDGE_BUS_NAME`    | `polaris-events`          | Bus custom EventBridge                    |
| `AWS_ENDPOINT_URL`        | —                         | LocalStack / endpoint custom              |

EventBridge publica con `source=polaris.event-processor` y `detail-type`
alineado al topic Kafka (`vehicle.entry`, etc.). El payload incluye transición
de plaza (`previousStatus` → `currentStatus`) y metadatos del evento.

Health check:

```bash
curl http://localhost:3003/health
```

## Tests

```bash
pnpm test --filter event-processor-service
pnpm test:integration:kafka-consumer
pnpm test:integration:handlers
pnpm test:integration:eventbridge
```

| DoD | Comando                                                               |
| --- | --------------------------------------------------------------------- |
| 5.1 | `test:integration:kafka-consumer` — 8 topics                          |
| 5.2 | `test:integration:handlers` — entry/exit/occupancy → RDS + Redis      |
| 5.3 | `test:integration:eventbridge` — PutEvents + regla → SQS (LocalStack) |

## MSK (AWS)

El task role necesita policy `msk_client` (Connect, ReadData, DescribeTopic).
IaC ECS en Fase 5.7 — no desplegar infra hasta entonces.

## Roadmap

| Fase | Entrega                      |
| ---- | ---------------------------- |
| 5.1  | Scaffold + consumer 8 topics |
| 5.2  | Handlers vehicle/sensor      |
| 5.3  | EventBridge                  |
| 5.6  | IaC eventbridge + Lambda     |
| 5.7  | ECS + ECR                    |

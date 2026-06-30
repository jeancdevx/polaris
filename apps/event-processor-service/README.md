# event-processor-service

Consumidor Kafka de Polaris (Fase 5). NestJS 11 + Fastify + ESM, puerto
**3003**.

Procesa los 8 topics definidos en `@polaris/shared-types` → `KAFKA_TOPICS`. Los
handlers de negocio (Redis/RDS/EventBridge) llegan en Fase 5.2+.

## Desarrollo local

Prerequisito: Kafka local (`infra/local/docker-compose.yml`).

```bash
pnpm install
docker compose -f infra/local/docker-compose.yml up -d kafka-1 kafka-2 kafka-3 kafka-init

pnpm dev --filter event-processor-service
```

Variables (ver `infra/local/.env.local`):

| Variable                  | Default                   | Uso                                 |
| ------------------------- | ------------------------- | ----------------------------------- |
| `KAFKA_BROKERS`           | —                         | Brokers local o MSK                 |
| `KAFKA_AUTH_MODE`         | `plain`                   | `iam` en AWS (MSK SASL)             |
| `KAFKA_CLIENT_ID`         | `event-processor-service` | Cliente KafkaJS                     |
| `KAFKA_CONSUMER_GROUP_ID` | `event-processor-service` | Consumer group                      |
| `AWS_REGION`              | —                         | Requerido con `KAFKA_AUTH_MODE=iam` |

Health check:

```bash
curl http://localhost:3003/health
```

## Tests

```bash
pnpm test --filter event-processor-service
pnpm test:integration:kafka-consumer
```

DoD 5.1: integración publica y consume los **8 topics**.

## MSK (AWS)

El task role necesita policy `msk_client` (Connect, ReadData, DescribeTopic).
IaC ECS en Fase 5.7 — no desplegar infra hasta entonces.

## Roadmap

| Fase | Entrega                      |
| ---- | ---------------------------- |
| 5.1  | Scaffold + consumer 8 topics |
| 5.2  | Handlers vehicle/sensor      |
| 5.3  | EventBridge                  |
| 5.7  | ECS + ECR                    |

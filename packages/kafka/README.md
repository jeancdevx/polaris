# @polaris/kafka

Cliente Kafka base para Polaris (KafkaJS). Publica y consume eventos de dominio
en el clúster local o en Amazon MSK.

## Topics

Definidos en `@polaris/shared-types` → `KAFKA_TOPICS` (8 topics).

## Requisitos

Kafka local vía Docker:

```bash
docker compose -f infra/local/docker-compose.yml up -d kafka-1 kafka-2 kafka-3 kafka-init
```

Variables en `infra/local/.env.local`:

```env
KAFKA_BROKERS=localhost:9092,localhost:9094,localhost:9096
```

## Smoke test (publicar + consumir)

```bash
pnpm kafka:smoke
```

Publica un `reservation.created` y lo consume con un consumer group temporal.

## Uso en código

```typescript
import { createReservationCreatedEvent } from '@polaris/domain'
import {
  createConsumer,
  createKafka,
  createProducer,
  publishDomainEvent,
  runConsumer
} from '@polaris/kafka'
import { KAFKA_TOPICS } from '@polaris/shared-types'

const kafka = createKafka()
const producer = await createProducer(kafka)

await publishDomainEvent(producer, {
  topic: KAFKA_TOPICS.RESERVATION_CREATED,
  event: createReservationCreatedEvent({
    reservationId: 'res-001',
    userId: 'usr-12345',
    parkingSpotId: 'spot-03',
    expiresAt: '2025-06-19T12:00:00.000Z'
  })
})
```

Los mensajes se serializan con `domainEventToJson` y se validan al consumir con
los parsers de `schemas/`.

## Build

```bash
pnpm --filter @polaris/kafka build
```

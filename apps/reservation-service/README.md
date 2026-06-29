# reservation-service

Lógica de reservas de Polaris (Fase 4). NestJS 11 + Fastify + ESM.

## Desarrollo local

Prerequisito: Postgres + Redis (`infra/local/docker-compose.yml`) y datos
semilla.

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm db:sync-redis
pnpm dev --filter reservation-service
```

Health check (puerto por defecto **3002**):

```bash
curl http://localhost:3002/health
```

### Reservas (4.2)

`api-service` reenviará el `userId` del JWT en el header `X-User-Id` (Fase 4.5).
En local, pásalo manualmente:

```bash
curl -X POST http://localhost:3002/parking/reserve \
  -H "Content-Type: application/json" \
  -H "X-User-Id: usr-12345" \
  -d '{"parkingSpotId":"spot-07","reservationDate":"2025-06-19T14:00:00.000Z"}'
```

Cancelar:

```bash
curl -X DELETE "http://localhost:3002/parking/reserve/res-XXXXXXXX" \
  -H "X-User-Id: usr-12345"
```

Flujo interno:

1. Lock Redis `SET parking:lock:{spotId} NX EX 30`
2. Verificar plaza libre en Redis
3. Insertar reserva en RDS + actualizar `parking_spots`
4. Actualizar hash Redis y contadores
5. Liberar lock

## Tests

```bash
pnpm --filter reservation-service test
pnpm --filter reservation-service test:integration:reservation
```

## Roadmap

| Fase | Tarea                          |
| ---- | ------------------------------ |
| 4.1  | Scaffold                       |
| 4.2  | `POST/DELETE /parking/reserve` |
| 4.3  | Kafka producers                |
| 4.4  | IaC ECS                        |
| 4.5  | API Gateway                    |

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

### Reservas (4.2 + 4.5)

Vía API Gateway: enviar **idToken** en `Authorization: Bearer`. El servicio lee
`preferred_username` del JWT (API GW ya lo validó). El header `X-User-Id` sigue
disponible para pruebas locales o ALB directo. Ver
`iac/modules/api-gateway/README.md` para E2E.

Local:

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
5. Publicar `reservation.created` o `reservation.cancelled` en Kafka
6. Liberar lock

### Kafka (4.3)

Variables en `infra/local/.env.local` (mismas que el smoke test):

```env
KAFKA_BROKERS=localhost:9092,localhost:9094,localhost:9096
KAFKA_CLIENT_ID=reservation-service
```

En MSK dev:

```env
KAFKA_BROKERS=<bootstrap_brokers_sasl_iam>
KAFKA_AUTH_MODE=iam
AWS_REGION=us-east-2
```

## Tests

```bash
pnpm --filter reservation-service test
pnpm --filter reservation-service test:integration:reservation
pnpm --filter reservation-service test:integration:kafka
```

### Despliegue ECS (4.4)

```bash
pnpm docker:push:reservation-service:dev
cd iac/environments/dev && terraform apply
```

## Roadmap

| Fase | Tarea                             |
| ---- | --------------------------------- |
| 4.1  | Scaffold                          |
| 4.2  | `POST/DELETE /parking/reserve`    |
| 4.3  | Kafka producers                   |
| 4.4  | IaC ECS                           |
| 4.5  | API Gateway — rutas de reserva ✅ |

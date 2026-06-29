# reservation-service

Lógica de reservas de Polaris (Fase 4). NestJS 11 + Fastify + ESM.

## Desarrollo local

```bash
pnpm install
pnpm dev --filter reservation-service
```

Health check (puerto por defecto **3002**):

```bash
curl http://localhost:3002/health
```

Respuesta esperada:

```json
{ "status": "ok", "service": "reservation-service" }
```

## Roadmap

| Fase | Tarea                                                            |
| ---- | ---------------------------------------------------------------- |
| 4.1  | Scaffold (este servicio)                                         |
| 4.2  | `POST /parking/reserve`, `DELETE /parking/reserve/{id}`          |
| 4.3  | Kafka producers (`reservation.created`, `reservation.cancelled`) |
| 4.4  | IaC ECS (2 tasks dev)                                            |
| 4.5  | API Gateway — rutas de reserva                                   |

# sensor-data-processor

Lambda Node.js 24 que normaliza telemetría de ocupación FC-51 desde AWS IoT
Core.

## Responsabilidad

1. Recibir eventos MQTT `occupancy_changed` vía IoT Rule.
2. `PutItem` en DynamoDB `SensorReadings` (time-series por `spotId`).
3. Publicar `sensor.occupancy` en MSK Kafka para `event-processor-service`.

## Build

```bash
pnpm --filter @polaris/sensor-data-processor build
```

## Tests

```bash
pnpm --filter @polaris/sensor-data-processor test
pnpm --filter @polaris/sensor-data-processor test:integration
```

## Payload IoT

Topic: `parking/sensors/occupancy/{spotId}`

```json
{
  "deviceId": "spots-zone-a",
  "spotId": "spot-05",
  "event": "occupancy_changed",
  "status": "occupied",
  "sensorType": "fc-51",
  "timestamp": 1717001000000
}
```

## Smoke dev

Tras `terraform apply`:

```bash
pnpm sensor-data-processor:smoke:dev
```

Publica un `occupancy_changed` simulado por MQTT TLS y comprueba que la IoT rule
invocó `sensor-data-processor`.

Validación completa (DynamoDB + Kafka) requiere conectividad VPC estable en dev;
el smoke confirma el pipeline MQTT → rule → Lambda.

# rfid-validator

Lambda Node.js 24 — valida lecturas RFID desde IoT Core (ESP32 RC522).

## Flujo

1. Parsea payload IoT (`rfid_scan` en `parking/rfid/entry|exit/{deviceId}`)
2. Lookup RFID en DynamoDB `RFIDValidations` (fallback RDS `rfid_tags`)
3. Valida sesión en RDS:
   - **entry** → reserva `active` no expirada
   - **exit** → reserva `checked_in`
4. Publica Kafka `rfid.validation` (+ `audit.events` si denegado)
5. Opcional: comandos MQTT LCD/servo (`GATE_COMMANDS_ENABLED=true`)

## Build

```bash
pnpm --filter @polaris/rfid-validator build
```

## Tests

```bash
pnpm --filter @polaris/rfid-validator test
pnpm --filter @polaris/rfid-validator test:integration
```

## Deploy dev

```bash
pnpm --filter @polaris/rfid-validator build
cd iac/environments/dev && terraform apply
pnpm rfid-validator:smoke:dev
```

Variables Lambda (Terraform): `DATABASE_URL`, `RFID_VALIDATIONS_TABLE_NAME`,
`KAFKA_BROKERS`, `KAFKA_AUTH_MODE=iam`, `GATE_COMMANDS_ENABLED=false` (dev).

IoT Rule trigger → Fase 5.6/6.3.

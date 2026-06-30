# audit-logger

Lambda Node.js 24 — persiste eventos de auditoría en CloudWatch y S3.

## Flujo

1. Recibe eventos **EventBridge** (p. ej. `vehicle.entry` desde event-processor)
   o payloads `audit.events`
2. Escribe log estructurado en CloudWatch **`/polaris/audit`**
3. Archiva JSON en S3:
   `audit/year=YYYY/month=MM/day=DD/{timestamp}-{aggregateId}.json`

## Build

```bash
pnpm --filter @polaris/audit-logger build
```

## Tests

```bash
pnpm --filter @polaris/audit-logger test
pnpm --filter @polaris/audit-logger test:integration
```

## Deploy dev

```bash
pnpm --filter @polaris/audit-logger build
cd iac/environments/dev && terraform apply
pnpm audit-logger:smoke:dev
```

Variables Lambda: `AUDIT_CLOUDWATCH_LOG_GROUP`, `AUDIT_S3_BUCKET`,
`AUDIT_S3_PREFIX`.

Reglas EventBridge → Fase 5.6.

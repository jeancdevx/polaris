# DynamoDB module

Tres tablas planificadas en `docs/arquitectura.md` sección 10.

## Tablas

| Tabla                  | Clave                              | Archivo                    |
| ---------------------- | ---------------------------------- | -------------------------- |
| `RFIDValidations`      | `rfid_uid` (PK)                    | `rfid-validations.tf`      |
| `SensorReadings`       | `sensorId` (PK) + `timestamp` (SK) | `sensor-readings.tf`       |
| `WebSocketConnections` | `connectionId` (PK)                | `websocket-connections.tf` |

Nombres físicos: `{project}-{env}-RFIDValidations`, etc.

## Modo de capacidad

| Entorno          | Billing                       | Autoscaling                    |
| ---------------- | ----------------------------- | ------------------------------ |
| **dev**          | `PAY_PER_REQUEST` (on-demand) | —                              |
| **staging/prod** | `PROVISIONED`                 | read/write target tracking 70% |

## TTL

- `SensorReadings`: atributo `expiresAt` (telemetría efímera)
- `WebSocketConnections`: atributo `ttl` (conexiones AppSync)

## Uso

```hcl
module "dynamodb" {
  source = "../../modules/dynamodb"

  project_name = "polaris"
  environment  = "dev"
}
```

## Outputs

- `table_names`, `table_arns` — mapas por nombre lógico
- `billing_mode`

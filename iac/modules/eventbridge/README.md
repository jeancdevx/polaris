# EventBridge module

Bus custom y reglas de orquestación hacia Lambdas. Alineado con
`docs/arquitectura.md` sección 9 y `@polaris/eventbridge`.

## Recursos

| Recurso               | Archivo                 |
| --------------------- | ----------------------- |
| Bus `polaris-events`  | `bus.tf`                |
| Reglas → audit-logger | `rules-audit-logger.tf` |

Reglas activas (Fase 5.6):

| detail-type        | Target       |
| ------------------ | ------------ |
| `vehicle.entry`    | audit-logger |
| `vehicle.exit`     | audit-logger |
| `sensor.occupancy` | audit-logger |

Patrón: `source = polaris.event-processor` + `detail-type` del handler.

## Uso

```hcl
module "eventbridge" {
  source = "../../modules/eventbridge"

  project_name               = "polaris"
  environment                = "dev"
  audit_logger_function_arn  = module.audit_logger.function_arn
  audit_logger_function_name = module.audit_logger.function_name

  depends_on = [module.audit_logger]
}
```

## Outputs

- `bus_name`, `bus_arn`
- `audit_logger_rule_names`, `audit_logger_rule_arns`

## Smoke dev

Tras `terraform apply`, publicar un evento de prueba:

```bash
pnpm eventbridge:smoke:dev
```

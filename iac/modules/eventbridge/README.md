# EventBridge module

Bus custom y reglas de orquestación hacia Lambdas. Alineado con
`docs/arquitectura.md` sección 9 y `@polaris/eventbridge`.

## Recursos

| Recurso                      | Archivo                        |
| ---------------------------- | ------------------------------ |
| Bus `polaris-events`         | `bus.tf`                       |
| Reglas → audit-logger        | `rules-audit-logger.tf`        |
| Reglas → notification-sender | `rules-notification-sender.tf` |
| Schedules cleanup/health     | `rules-scheduled.tf`           |

Reglas activas (Fase 5.6–6.5):

| Trigger                       | Target              |
| ----------------------------- | ------------------- |
| `vehicle.entry` (bus)         | audit-logger        |
| `vehicle.exit` (bus)          | audit-logger        |
| `sensor.occupancy` (bus)      | audit-logger        |
| `reservation.created` (bus)   | notification-sender |
| `reservation.cancelled` (bus) | notification-sender |
| `rate(5 minutes)` (schedule)  | reservation-cleanup |
| `rate(1 minute)` (schedule)   | health-checker      |

## Smoke dev

```bash
pnpm scheduled-lambdas:smoke:dev
```

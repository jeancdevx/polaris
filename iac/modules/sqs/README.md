# SQS module

Colas planificadas en `docs/arquitectura.md` sección 9.

## Colas

| Clave lógica              | Nombre físico                             | Archivo                      |
| ------------------------- | ----------------------------------------- | ---------------------------- |
| `reservation`             | `{project}-{env}-reservation-queue`       | `reservation-queue.tf`       |
| `dlq_sensor_processing`   | `{project}-{env}-dlq-sensor-processing`   | `dlq-sensor-processing.tf`   |
| `dlq_notification_sender` | `{project}-{env}-dlq-notification-sender` | `dlq-notification-sender.tf` |

Todas usan SSE-SQS administrado por AWS.

## Uso

```hcl
module "sqs" {
  source = "../../modules/sqs"

  project_name = "polaris"
  environment  = "dev"
}
```

## Outputs

- `queue_names`, `queue_urls`, `queue_arns` — mapas por clave lógica

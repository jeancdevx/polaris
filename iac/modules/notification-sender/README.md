# notification-sender module

Lambda Node.js 24 (Fase 5.5) — recibe eventos EventBridge (p. ej.
`vehicle.entry` desde event-processor) y persiste auditoría en CloudWatch
`/polaris/audit` + S3.

## Archivos

| Archivo       | Responsabilidad                      |
| ------------- | ------------------------------------ |
| `build.tf`    | Zip del artefacto (`archive_file`)   |
| `function.tf` | Lambda sin VPC                       |
| `logs.tf`     | `/aws/lambda/...` + `/polaris/audit` |

## Requisitos

- `pnpm --filter @polaris/notification-sender build` antes de `terraform plan`
- Role `notification_sender` del módulo `iam`
- Bucket S3 `audit_logs` del módulo `s3`

## Uso

```hcl
module "notification_sender" {
  source = "../../modules/notification-sender"

  project_name = "polaris"
  environment  = "dev"

  lambda_role_arn          = module.iam.notification_sender_role_arn
  audit_logs_bucket_name   = module.s3.audit_logs_bucket_name

  tags = var.tags
}
```

EventBridge rules → módulo `eventbridge` (Fase 5.6): `vehicle.entry`,
`vehicle.exit` y `sensor.occupancy` invocan esta Lambda automáticamente.

## Smoke test

```bash
pnpm notification-sender:smoke:dev
pnpm eventbridge:smoke:dev
```

## Outputs

- `function_arn`, `function_name`
- `audit_log_group_name`, `log_group_name`

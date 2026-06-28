# S3 module

Cuatro buckets según `docs/arquitectura.md` sección 15.

## Buckets

| Bucket lógico | Nombre físico                             | Archivo         |
| ------------- | ----------------------------------------- | --------------- |
| audit-logs    | `{project}-audit-logs-{env}-{account_id}` | `audit-logs.tf` |
| backups       | `{project}-backups-{env}-{account_id}`    | `backups.tf`    |
| assets        | `{project}-assets-{env}-{account_id}`     | `assets.tf`     |
| alb-logs      | `{project}-alb-logs-{env}-{account_id}`   | `alb-logs.tf`   |

## Seguridad y lifecycle

- Cifrado SSE-S3 (o SSE-KMS con `kms_key_arn`)
- Bloqueo de acceso público en todos los buckets
- Política HTTPS-only en todos los buckets
- Versioning habilitado en todos; requisito explícito en backups
- Transición a Glacier a 90 días (configurable) en audit-logs, backups y
  alb-logs
- Política de escritura ELB en alb-logs para access logs del ALB (fase 3)

## Uso

```hcl
module "s3" {
  source = "../../modules/s3"

  project_name = "polaris"
  environment  = "dev"
}
```

## Outputs

- `bucket_names`, `bucket_arns` — mapas por clave lógica
- `audit_logs_bucket_name`, `backups_bucket_name`, `assets_bucket_name`,
  `alb_logs_bucket_name`
- `audit_logs_bucket_arn`, `backups_bucket_arn`, `assets_bucket_arn`,
  `alb_logs_bucket_arn`

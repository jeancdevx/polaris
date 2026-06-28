# Secrets Manager module

Configura la rotación automática del secret de credenciales maestras de Aurora
creado por el módulo `rds` (`manage_master_user_password = true`).

## Rotación RDS

| Archivo           | Responsabilidad                                 |
| ----------------- | ----------------------------------------------- |
| `rds-rotation.tf` | `aws_secretsmanager_secret_rotation` sin Lambda |

El secret creado por RDS es **service-managed** (`rds!cluster-*`). AWS rota las
credenciales internamente; no se puede (ni hace falta) adjuntar una Lambda de
rotación custom.

Solo se define el schedule (`automatically_after_days`).

El role `secrets_rotation` del módulo `iam` queda disponible para secretos
custom (API keys, etc.) en fases posteriores.

## Uso

```hcl
module "secrets_manager" {
  source = "../../modules/secrets-manager"

  project_name = "polaris"
  environment  = "dev"

  rds_master_secret_arn    = module.rds.master_user_secret_arn
  rotation_lambda_role_arn = module.iam.secrets_rotation_role_arn
}
```

## Variables

| Variable              | Default por entorno          |
| --------------------- | ---------------------------- |
| `enable_rds_rotation` | `true`                       |
| `rds_rotation_days`   | `30`                         |
| `rotate_immediately`  | `false` en dev, `true` resto |

## Outputs

- `rds_master_secret_arn`
- `rds_rotation_enabled`, `rds_rotation_days`
- `rds_rotation_id`

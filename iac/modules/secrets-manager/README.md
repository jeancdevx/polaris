# Secrets Manager module

Configura la rotación automática del secret de credenciales maestras de Aurora
creado por el módulo `rds` (`manage_master_user_password = true`).

## Rotación RDS

| Archivo           | Responsabilidad                                              |
| ----------------- | ------------------------------------------------------------ |
| `rds-rotation.tf` | `AWS::SecretsManager::RotationSchedule` con Lambda hospedada |

Usa `HostedRotationLambda` con plantilla **PostgreSQLSingleUser**. Secrets
Manager despliega la Lambda de rotación en la VPC; no requiere acceso a
Serverless Application Repository.

El role `secrets_rotation` del módulo `iam` queda disponible para rotación de
secretos custom (API keys, etc.) en fases posteriores.

## Requisitos de red

- Subnets privadas con ruta a Aurora
- Security group Lambda con egress; el SG RDS debe permitir ingress desde el SG
  Lambda (`rds_from_lambda` en `security-groups`)

## Uso

```hcl
module "secrets_manager" {
  source = "../../modules/secrets-manager"

  project_name = "polaris"
  environment  = "dev"

  rds_master_secret_arn    = module.rds.master_user_secret_arn
  rotation_lambda_role_arn = module.iam.secrets_rotation_role_arn

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]
}
```

## Variables

| Variable              | Default por entorno                                                       |
| --------------------- | ------------------------------------------------------------------------- |
| `enable_rds_rotation` | `true`                                                                    |
| `rds_rotation_days`   | `30`                                                                      |
| `rotate_immediately`  | `false` en dev, `true` resto (mapea a `RotateImmediatelyOnUpdate` en CFN) |

## Outputs

- `rds_master_secret_arn`
- `rds_rotation_enabled`, `rds_rotation_days`
- `rds_rotation_lambda_name`, `rds_rotation_schedule_id`

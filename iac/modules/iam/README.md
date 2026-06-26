# IAM module

Roles y policies centralizados para Polaris. Los módulos `rds`, `kafka`,
`secrets-manager`, `ecs` y `lambda` consumen ARNs de salida; no crean IAM
propio.

## Archivos

| Archivo                       | Responsabilidad                               |
| ----------------------------- | --------------------------------------------- |
| `msk-policies.tf`             | Policies MSK client y topic admin             |
| `secrets-policies.tf`         | Policies lectura y rotación de secrets        |
| `rds-enhanced-monitoring.tf`  | Role para Aurora enhanced monitoring          |
| `msk-client-role.tf`          | Role ECS/Lambda + MSK + secrets read          |
| `kafka-topic-creator-role.tf` | Role Lambda para crear topics MSK (Fase 2.12) |
| `secrets-rotation-role.tf`    | Role Lambda para rotación RDS (Fase 2.10)     |

## Fase 2

| Recurso                   | Uso                                    |
| ------------------------- | -------------------------------------- |
| `rds_enhanced_monitoring` | Módulo `rds`                           |
| `msk_client` policy/role  | Servicios NestJS + Lambda con IAM SASL |
| `msk_topic_admin`         | Lambda `kafka-topic-creator`           |
| `secrets_read`            | Acceso a credenciales RDS              |
| `secrets_rotation`        | Rotación automática en Secrets Manager |

## Variables opcionales

- `msk_cluster_arn` — ARN exacto tras desplegar MSK; si vacío usa wildcard
  `polaris-dev-kafka/*`
- `secrets_manager_secret_arns` — ARNs explícitos; si vacío usa patrones
  `polaris/dev/rds-*`
- `kms_key_arns` — claves KMS para decrypt; si vacío permite keys de la cuenta

## Uso

```hcl
module "iam" {
  source = "../../modules/iam"

  project_name = "polaris"
  environment  = "dev"
}
```

Tras crear el cluster MSK:

```hcl
module "iam" {
  source = "../../modules/iam"

  project_name    = "polaris"
  environment     = "dev"
  msk_cluster_arn = module.kafka.cluster_arn
}
```

## Fases posteriores

- **Fase 3:** roles ECS task/execution por servicio (adjuntar
  `msk_client_policy_arn`, `secrets_read_policy_arn`)
- **Fase 5:** roles Lambda execution por función

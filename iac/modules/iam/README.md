# IAM module

Roles y policies centralizados para Polaris. Los módulos `rds`, `kafka`,
`secrets-manager`, `ecs` y `lambda` consumen ARNs de salida; no crean IAM
propio.

## Archivos

| Archivo                            | Responsabilidad                                 |
| ---------------------------------- | ----------------------------------------------- |
| `msk-policies.tf`                  | Policies MSK client y topic admin               |
| `secrets-policies.tf`              | Policies lectura y rotación de secrets          |
| `rds-enhanced-monitoring.tf`       | Role para Aurora enhanced monitoring            |
| `msk-client-role.tf`               | Role ECS/Lambda + MSK + secrets read            |
| `kafka-topic-creator-role.tf`      | Role Lambda para crear topics MSK (Fase 2.12)   |
| `kafka-msk-smoke-role.tf`          | Role Lambda smoke test MSK IAM (Fase 2.13)      |
| `ecs-execution-role.tf`            | Role execution ECS Fargate (ECR, logs, secrets) |
| `ecs-api-service-task-role.tf`     | Task role api-service (Cognito auth API)        |
| `ecs-event-processor-task-role.tf` | Task role event-processor (MSK + EventBridge)   |
| `eventbridge-publish-policy.tf`    | PutEvents al bus `polaris-events`               |
| `secrets-rotation-role.tf`         | Role Lambda para rotación RDS (Fase 2.10)       |

## Fase 2

| Recurso                   | Uso                                    |
| ------------------------- | -------------------------------------- |
| `rds_enhanced_monitoring` | Módulo `rds`                           |
| `msk_client` policy/role  | Servicios NestJS + Lambda con IAM SASL |
| `msk_topic_admin`         | Lambda `kafka-topic-creator`           |
| `msk_client`              | Lambda `kafka-msk-smoke`, ECS (Fase 3) |
| `secrets_read`            | Acceso a credenciales RDS              |
| `secrets_rotation`        | Rotación automática en Secrets Manager |

## Variables opcionales

- `msk_cluster_arn` — ARN exacto tras desplegar MSK; topic/group ARNs se derivan
  con sufijo `/*`; si vacío usa wildcard `polaris-dev-kafka/*/*`
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

- **Fase 3:** ✅ roles ECS execution + api-service task (Cognito auth API)
- **Fase 5:** roles Lambda execution por función

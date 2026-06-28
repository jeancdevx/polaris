# kafka-topic-creator module

Lambda infra-only que crea los 8 topics MSK definidos en `@polaris/shared-types`
cuando `auto.create.topics.enable=false`.

## Archivos

| Archivo         | Responsabilidad                                  |
| --------------- | ------------------------------------------------ |
| `build.tf`      | Zip del artefacto con `archive_file` (plan-time) |
| `function.tf`   | Log group + Lambda en VPC                        |
| `invocation.tf` | Invocación post-deploy vía Terraform             |

## Requisitos

- `pnpm` y `zip` disponibles en la máquina que ejecuta `terraform apply`
- Role `kafka_topic_creator` del módulo `iam` (MSK topic admin + VPC ENI)
- Subnets privadas + SG Lambda con acceso MSK (`msk_from_lambda`)

## Uso

```hcl
module "kafka_topic_creator" {
  source = "../../modules/kafka-topic-creator"

  project_name = "polaris"
  environment  = "dev"

  lambda_role_arn    = module.iam.kafka_topic_creator_role_arn
  bootstrap_brokers  = module.kafka.bootstrap_brokers_sasl_iam
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  num_partitions        = 3
  replication_factor    = 3
  min_insync_replicas   = 2
}
```

## Build del artefacto

1. Compilar la Lambda (Rolldown):
   `pnpm --filter @polaris/kafka-topic-creator build`
2. `terraform plan` empaqueta `dist/` en el zip vía `data.archive_file`

El zip y el `source_code_hash` se calculan en **plan** (provider `archive`). No
uses `file()` sobre `dist/` en otros recursos — provoca _inconsistent result_ si
el build corre en apply y el hash se lee en plan.

## Observabilidad

- X-Ray tracing activo (`enable_xray_tracing = true`)
- Variables Powertools: `POWERTOOLS_SERVICE_NAME`, `POWERTOOLS_LOG_LEVEL`,
  `POWERTOOLS_METRICS_NAMESPACE`

## Topics creados

Los nombres vienen de `KAFKA_TOPICS` en `@polaris/shared-types`:

- `vehicle.entry`, `vehicle.exit`
- `sensor.occupancy`, `sensor.proximity`
- `reservation.created`, `reservation.cancelled`
- `rfid.validation`, `audit.events`

## Outputs

- `function_arn`, `function_name`
- `log_group_name`
- `invocation_result`

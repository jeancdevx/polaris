# kafka-topic-creator module

Lambda infra-only que crea los 8 topics MSK definidos en `@polaris/shared-types`
cuando `auto.create.topics.enable=false`.

## Archivos

| Archivo         | Responsabilidad                                       |
| --------------- | ----------------------------------------------------- |
| `build.tf`      | Build Rolldown + zip del artefacto (`terraform_data`) |
| `function.tf`   | Log group + Lambda en VPC                             |
| `invocation.tf` | Invocación post-deploy vía Terraform                  |

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

El zip se genera en `apply` vía `terraform_data` (no usar `file()` sobre `dist/`
— evita _inconsistent result_ entre plan y apply).

Para un clone nuevo, `terraform plan` puede fallar si el zip aún no existe; usa
`terraform apply` directamente o ejecuta antes:

```bash
pnpm --filter @polaris/kafka-topic-creator build
mkdir -p iac/modules/kafka-topic-creator/.terraform
(cd lambdas/kafka-topic-creator/dist && zip -j ../../../iac/modules/kafka-topic-creator/.terraform/polaris-dev-kafka-topic-creator.zip index.js package.json)
```

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

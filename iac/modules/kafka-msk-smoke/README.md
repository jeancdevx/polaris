# kafka-msk-smoke module

Lambda on-demand (Fase 2.13) para validar conectividad MSK IAM SASL desde la VPC
con el rol `msk_client`: produce y consume `reservation.created`.

## Archivos

| Archivo       | Responsabilidad                    |
| ------------- | ---------------------------------- |
| `build.tf`    | Zip del artefacto (`archive_file`) |
| `function.tf` | Log group + Lambda en VPC          |

## Requisitos

- `pnpm --filter @polaris/kafka-msk-smoke build` antes de `terraform plan`
- Role `kafka_msk_smoke` del módulo `iam` (policy `msk_client` + VPC ENI)
- Topics MSK creados (módulo `kafka-topic-creator`, Fase 2.12)
- Subnets privadas + SG Lambda con acceso MSK

## Uso

```hcl
module "kafka_msk_smoke" {
  source = "../../modules/kafka-msk-smoke"

  project_name = "polaris"
  environment  = "dev"

  lambda_role_arn   = module.iam.kafka_msk_smoke_role_arn
  bootstrap_brokers = module.kafka.bootstrap_brokers_sasl_iam

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  tags = var.tags
}
```

## Smoke test

Tras `terraform apply`:

```bash
pnpm kafka:smoke:msk:dev
```

No hay invocación automática en deploy.

## Outputs

- `function_arn`, `function_name`
- `log_group_name`

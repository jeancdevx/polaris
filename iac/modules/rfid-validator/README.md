# rfid-validator module

Lambda Node.js 24 (Fase 5.4) — valida lecturas RFID desde IoT Core, consulta
DynamoDB/RDS, publica `rfid.validation` a MSK y opcionalmente comandos MQTT.

## Archivos

| Archivo       | Responsabilidad                      |
| ------------- | ------------------------------------ |
| `build.tf`    | Zip del artefacto (`archive_file`)   |
| `data.tf`     | `DATABASE_URL` desde Secrets Manager |
| `function.tf` | Log group + Lambda en VPC            |

## Requisitos

- `pnpm --filter @polaris/rfid-validator build` antes de `terraform plan`
- Role `rfid_validator` del módulo `iam`
- Topics MSK creados (módulo `kafka-topic-creator`)
- Tabla DynamoDB `RFIDValidations` + acceso RDS desde VPC

## Uso

```hcl
module "rfid_validator" {
  source = "../../modules/rfid-validator"

  project_name = "polaris"
  environment  = "dev"

  lambda_role_arn              = module.iam.rfid_validator_role_arn
  bootstrap_brokers            = module.kafka.bootstrap_brokers_sasl_iam
  rfid_validations_table_name  = module.dynamodb.table_names.RFIDValidations
  rds_master_secret_arn        = module.rds.master_user_secret_arn
  rds_cluster_endpoint         = module.rds.cluster_endpoint
  rds_database_name            = module.rds.database_name

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  tags = var.tags
}
```

## Smoke test

Tras `terraform apply`:

```bash
pnpm rfid-validator:smoke:dev
pnpm iot:smoke:dev
```

IoT rules `parking/rfid/entry/+` y `parking/rfid/exit/+` → esta Lambda (módulo
`iot-core`, Fase 6.3).

## Outputs

- `function_arn`, `function_name`
- `log_group_name`

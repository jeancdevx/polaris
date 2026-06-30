# sensor-data-processor module

Lambda Node.js 24 que persiste telemetría FC-51 en DynamoDB y publica
`sensor.occupancy` en MSK.

## Prerequisitos

- `pnpm --filter @polaris/sensor-data-processor build` antes de `terraform plan`
- Role `sensor_data_processor` del módulo `iam`
- Tabla `SensorReadings` del módulo `dynamodb`
- MSK con topic `sensor.occupancy`

## Uso

```hcl
module "sensor_data_processor" {
  source = "../../modules/sensor-data-processor"

  project_name = "polaris"
  environment  = "dev"

  lambda_role_arn              = module.iam.sensor_data_processor_role_arn
  bootstrap_brokers            = module.kafka.bootstrap_brokers_sasl_iam
  sensor_readings_table_name   = module.dynamodb.table_names.SensorReadings

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_security_group_id]

  depends_on = [module.kafka_topic_creator]
}
```

## Smoke dev

```bash
pnpm sensor-data-processor:smoke:dev
```

IoT Rule `sensor_occupancy` en `iot-core` (Fase 6.4) invoca esta Lambda.

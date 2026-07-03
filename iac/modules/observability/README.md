# observability

CloudWatch dashboards y alarmas operacionales para Polaris (Fase 8.3).

## Recursos

| Archivo                 | Contenido                                                                   |
| ----------------------- | --------------------------------------------------------------------------- |
| `sns-alarm-policy.tf`   | Policy SNS para `cloudwatch.amazonaws.com` + suscripciones email opcionales |
| `alarms-ecs.tf`         | CPU ECS por servicio (> 80 % por defecto)                                   |
| `alarms-alb.tf`         | Hosts unhealthy + 5XX en ALB                                                |
| `alarms-api-gateway.tf` | 5XX API pública                                                             |
| `alarms-appsync.tf`     | 5XX AppSync                                                                 |
| `alarms-rds.tf`         | CPU Aurora                                                                  |
| `alarms-lambda.tf`      | Errores Lambda críticas                                                     |
| `alarms-sqs.tf`         | Mensajes en DLQ                                                             |
| `dashboards-system.tf`  | Dashboard ECS + ALB + RDS                                                   |

Todas las alarmas publican en el topic SNS `alerts` existente (`module.sns`).

## X-Ray

Lambda y AppSync ya tienen tracing activo en sus módulos. API Gateway HTTP v2
expone métricas detalladas vía alarmas; tracing distribuido ECS requiere ADOT en
una fase posterior.

## Uso (dev)

```hcl
module "observability" {
  source = "../../modules/observability"

  project_name         = var.project_name
  environment          = var.environment
  tags                 = var.tags
  sns_alerts_topic_arn = module.sns.alerts_topic_arn

  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_names  = module.ecs.ecs_service_names
  alb_arn_suffix     = module.ecs.alb_arn_suffix
  alb_target_group_arn_suffixes = module.ecs.alb_target_group_arn_suffixes

  api_gateway_public_api_id = module.api_gateway.api_id
  appsync_api_id            = module.appsync.api_id
  rds_cluster_identifier    = module.rds.cluster_id

  lambda_function_names = [
    module.health_checker.function_name,
    module.rfid_validator.function_name,
    module.sensor_data_processor.function_name,
    module.notification_sender.function_name,
  ]

  sqs_dlq_queue_names = [
    module.sqs.queue_names.dlq_sensor_processing,
    module.sqs.queue_names.dlq_notification_sender,
  ]
}
```

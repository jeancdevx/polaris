# ECS module

Cluster Fargate, ALB interno y despliegue de servicios ECS.

## Organización

| Archivo            | Responsabilidad                            |
| ------------------ | ------------------------------------------ |
| `cluster.tf`       | ECS cluster                                |
| `alb.tf`           | Application Load Balancer                  |
| `target-groups.tf` | Target groups por servicio                 |
| `listeners.tf`     | Listener HTTP + reglas ALB (`for_each`)    |
| `data.tf`          | Lectura credenciales RDS (Secrets Manager) |
| `locals.tf`        | Naming, env secrets, mapa de reglas ALB    |
| `secrets.tf`       | Secrets Manager por servicio               |
| `log-groups.tf`    | CloudWatch Logs por servicio               |
| `tasks.tf`         | Task definitions                           |
| `services.tf`      | ECS services (ALB + workers internos)      |
| `moved.tf`         | State migration para reglas ALB            |

Los **data sources** viven en `data.tf`. La composición de secretos
(DATABASE_URL, REDIS_URL, KAFKA_BROKERS) vive en `locals.tf` + `secrets.tf` — no
en archivos por servicio.

## Routing ALB

| Prioridad | Método   | Path                 | Target              |
| --------- | -------- | -------------------- | ------------------- |
| default   | \*       | \*                   | api-service         |
| 10        | `POST`   | `/parking/reserve`   | reservation-service |
| 11        | `DELETE` | `/parking/reserve/*` | reservation-service |
| 20        | `*`      | `/admin`, `/admin/*` | admin-service       |

Las reglas explícitas se definen en `local.alb_listener_rules` (`locals.tf`).

## Servicios ECS

| Servicio                  | Puerto | ALB | Secrets keys                                      |
| ------------------------- | ------ | --- | ------------------------------------------------- |
| `api-service`             | 3001   | Sí  | `DATABASE_URL`, `REDIS_URL`                       |
| `reservation-service`     | 3002   | Sí  | `DATABASE_URL`, `REDIS_URL`, `KAFKA_BROKERS`      |
| `admin-service`           | 3004   | Sí  | `DATABASE_URL`, `REDIS_URL`, `RFID_VALIDATIONS_*` |
| `event-processor-service` | 3003   | No  | `DATABASE_URL`, `REDIS_URL`, `KAFKA_BROKERS`      |

## Secrets

| Secret                                 | Keys                                                       |
| -------------------------------------- | ---------------------------------------------------------- |
| `{prefix}-api-service-env`             | `DATABASE_URL`, `REDIS_URL`                                |
| `{prefix}-reservation-service-env`     | `DATABASE_URL`, `REDIS_URL`, `KAFKA_BROKERS`               |
| `{prefix}-event-processor-service-env` | `DATABASE_URL`, `REDIS_URL`, `KAFKA_BROKERS`               |
| `{prefix}-admin-service-env`           | `DATABASE_URL`, `REDIS_URL`, `RFID_VALIDATIONS_TABLE_NAME` |

En **dev**, `recovery_window_in_days = 0` permite recrear el secret tras
`terraform destroy` sin esperar la ventana de borrado de AWS.

Si un apply falla con _"secret is already scheduled for deletion"_:

```bash
aws secretsmanager restore-secret --secret-id polaris-dev-api-service-env --region us-east-2
aws secretsmanager restore-secret --secret-id polaris-dev-reservation-service-env --region us-east-2
# Luego: terraform apply
```

O forzar borrado inmediato y volver a aplicar:

```bash
aws secretsmanager delete-secret \
  --secret-id polaris-dev-api-service-env \
  --force-delete-without-recovery \
  --region us-east-2
```

## Verificación post-apply

```bash
pnpm docker:push:api-service:dev
pnpm docker:push:reservation-service:dev
pnpm docker:push:event-processor-service:dev
pnpm docker:push:admin-service:dev

cd iac/environments/dev
terraform apply -var-file=dev.tfvars

API=$(terraform output -raw api_gateway_endpoint)
curl -s "${API}health"

pnpm event-processor:smoke:dev
pnpm api-gateway-private:smoke:dev
```

## Outputs

- `alb_listener_arn` — integración API Gateway VPC Link
- `cluster_name`, `cluster_arn`
- `api_service_env_secret_arn`, `reservation_service_env_secret_arn`,
  `event_processor_service_env_secret_arn` (sensitive)
- `event_processor_service_name`, `event_processor_service_log_group_name`
- `*_target_group_arn`, `*_task_definition_arn`, `*_log_group_name`

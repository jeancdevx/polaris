# ECS module

Cluster ECS Fargate, ALB interno y despliegue de **api-service** (Fase 3.5) y
**reservation-service** (Fase 4.4).

## Archivos

| Archivo                                 | Responsabilidad                               |
| --------------------------------------- | --------------------------------------------- |
| `cluster.tf`                            | ECS cluster                                   |
| `alb.tf`                                | Application Load Balancer                     |
| `target-group.tf`                       | Target group api-service + listener HTTP      |
| `reservation-service-target-group.tf`   | Target group reservation-service              |
| `reservation-service-listener-rules.tf` | Reglas ALB `/parking/reserve`                 |
| `log-group.tf`                          | CloudWatch Logs                               |
| `api-service-secrets.tf`                | Secret `DATABASE_URL` + `REDIS_URL`           |
| `reservation-service-secrets.tf`        | Secret + `KAFKA_BROKERS` (MSK IAM)            |
| `api-service-task.tf`                   | Task definition api-service                   |
| `reservation-service-task.tf`           | Task definition reservation-service           |
| `api-service-service.tf`                | ECS service api-service                       |
| `reservation-service-service.tf`        | ECS service reservation-service (2 tasks dev) |

## Routing ALB

| Prioridad | Método   | Path                 | Target              |
| --------- | -------- | -------------------- | ------------------- |
| default   | \*       | \*                   | api-service         |
| 10        | `POST`   | `/parking/reserve`   | reservation-service |
| 11        | `DELETE` | `/parking/reserve/*` | reservation-service |

## Secret reservation-service

`{project}-{env}-reservation-service-env`:

- `DATABASE_URL` — igual que api-service (RDS TLS)
- `REDIS_URL`
- `KAFKA_BROKERS` — bootstrap brokers SASL IAM de MSK

Variables de entorno: `KAFKA_AUTH_MODE=iam`,
`KAFKA_CLIENT_ID=reservation-service`.

Task role: policy `msk_client` (publicar `reservation.created` /
`reservation.cancelled`).

## Verificación post-apply

```bash
# Imagen en ECR
pnpm docker:push:reservation-service:dev

cd iac/environments/dev
terraform apply

# Health api-service (listener default)
ALB=$(terraform output -raw api_service_alb_dns_name)
curl -s "http://${ALB}/health"

# 2 tasks reservation-service
aws ecs describe-services \
  --cluster "$(terraform output -raw api_service_ecs_cluster_name)" \
  --services "$(terraform output -raw reservation_service_ecs_service_name)" \
  --query 'services[0].{desired:desiredCount,running:runningCount}'
```

Desde VPC (con `alb_ingress_cidr_blocks` o bastion):

```bash
curl -s -X POST "http://${ALB}/parking/reserve" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: usr-12345" \
  -d '{"parkingSpotId":"spot-07","reservationDate":"2025-06-19T14:00:00.000Z"}'
```

## Outputs

- `reservation_service_target_group_arn`
- `reservation_service_env_secret_arn` (sensitive)
- `reservation_service_log_group_name`

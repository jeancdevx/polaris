# ECS module

Cluster ECS Fargate, ALB y despliegue de **api-service** (Fase 3.5).

## Archivos

| Archivo                  | Responsabilidad                               |
| ------------------------ | --------------------------------------------- |
| `cluster.tf`             | ECS cluster                                   |
| `alb.tf`                 | Application Load Balancer                     |
| `target-group.tf`        | Target group + listener HTTP                  |
| `log-group.tf`           | CloudWatch Logs                               |
| `api-service-secrets.tf` | Secret compuesto `DATABASE_URL` + `REDIS_URL` |
| `api-service-task.tf`    | Task definition Fargate                       |
| `api-service-service.tf` | ECS service + registro en ALB                 |

## Secret de aplicación

El secret `{project}-{env}-api-service-env` combina credenciales RDS (username y
password del secret gestionado de Aurora) con endpoint/puerto/base de datos del
módulo `rds` y `REDIS_URL`. Tras rotación automática de RDS, ejecutar
`terraform apply` para refrescar el secret compuesto.

## Health check

- Target group: `GET /health` → 200
- Container: mismo path vía `fetch` en Node 24

## Uso

```hcl
module "ecs" {
  source = "../../modules/ecs"

  project_name = "polaris"
  environment  = "dev"
  aws_region   = "us-east-2"

  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids

  alb_security_group_id = module.security_groups.alb_security_group_id
  ecs_security_group_id = module.security_groups.ecs_security_group_id

  ecs_task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  ecs_api_service_task_role_arn = module.iam.ecs_api_service_task_role_arn

  ecr_repository_url    = module.ecr.repository_url
  api_service_image_tag   = "latest"
  api_service_desired_count = 1

  rds_master_user_secret_arn = module.rds.master_user_secret_arn
  rds_cluster_endpoint       = module.rds.cluster_endpoint
  rds_cluster_port           = module.rds.cluster_port
  rds_database_name          = module.rds.database_name
  redis_url                  = module.redis.redis_url

  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_app_client_id = module.cognito.app_client_id
  cognito_issuer_url    = module.cognito.issuer_url

  alb_logs_bucket_name = module.s3.alb_logs_bucket_name
}
```

## Verificación post-apply

```bash
ALB=$(terraform output -raw api_service_alb_dns_name)
curl -s "http://${ALB}/health"
```

## Outputs

- `alb_dns_name` — DNS del ALB (health check directo en 3.5)
- `cluster_name`, `api_service_target_group_arn`
- `api_service_env_secret_arn` (sensitive)

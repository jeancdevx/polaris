# ECR module

Repositorio Docker por servicio ECS.

## Recursos

| Recurso                            | Nombre                               |
| ---------------------------------- | ------------------------------------ |
| `aws_ecr_repository.service`       | `{project}-{env}-{service_name}`     |
| `aws_ecr_lifecycle_policy.service` | Expira imágenes sin tag a los 7 días |

## Environment

Instanciar **un módulo por servicio** en el mismo archivo del environment:

```hcl
# iac/environments/dev/ecr.tf

module "ecr_api_service" {
  source       = "../../modules/ecr"
  project_name = var.project_name
  environment  = var.environment
  service_name = "api-service"
  tags         = var.tags
}

module "ecr_reservation_service" {
  source       = "../../modules/ecr"
  project_name = var.project_name
  environment  = var.environment
  service_name = "reservation-service"
  tags         = var.tags
}
```

## Import (repo creado antes del primer apply)

```bash
cd iac/environments/dev

terraform import 'module.ecr_api_service.aws_ecr_repository.service' polaris-dev-api-service
terraform import 'module.ecr_reservation_service.aws_ecr_repository.service' polaris-dev-reservation-service
```

## Outputs

- `repository_url` — URI para `docker push` y task definition ECS
- `repository_name`
- `repository_arn`

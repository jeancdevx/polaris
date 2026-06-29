# ECR module

Repositorios de imágenes Docker para servicios ECS.

## Fase 3.5

| Recurso                      | Nombre                        | Uso                  |
| ---------------------------- | ----------------------------- | -------------------- |
| `aws_ecr_repository.service` | `{project}-{env}-api-service` | Imagen `api-service` |

## Repositorio existente (import)

Si el repo se creó con `scripts/push-api-service-ecr-dev.sh` antes del primer
`terraform apply`:

```bash
cd iac/environments/dev
terraform import 'module.ecr.aws_ecr_repository.service' polaris-dev-api-service
```

## Uso

```hcl
module "ecr" {
  source = "../../modules/ecr"

  project_name = "polaris"
  environment  = "dev"
  service_name = "api-service"
}
```

## Outputs

- `repository_url` — URI para task definition ECS
- `repository_name` — nombre del repositorio
- `repository_arn` — ARN del repositorio

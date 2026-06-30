# Lambda module

Módulo genérico para funciones Node.js 24 desplegadas desde un zip. Los roles
IAM viven en `iac/modules/iam`; los triggers EventBridge en
`iac/modules/eventbridge`.

Lambdas existentes (`audit-logger`, `rfid-validator`, …) mantienen módulos
dedicados con build embebido. Usar este módulo para nuevas Lambdas de Fase 6+.

## Recursos

| Recurso                | Archivo       |
| ---------------------- | ------------- |
| `aws_lambda_function`  | `function.tf` |
| Log group de ejecución | `logs.tf`     |

## Uso

```hcl
data "archive_file" "notification_sender" {
  type        = "zip"
  source_dir  = "${path.module}/../../../lambdas/notification-sender/dist"
  output_path = "${path.module}/.terraform/notification-sender.zip"
}

module "notification_sender" {
  source = "../../modules/lambda"

  project_name     = "polaris"
  environment      = "dev"
  function_name    = "polaris-dev-notification-sender"
  lambda_role_arn  = module.iam.notification_sender_role_arn
  filename         = data.archive_file.notification_sender.output_path
  source_code_hash = data.archive_file.notification_sender.output_base64sha256

  environment_variables = {
    SOME_CONFIG = "value"
  }
}
```

VPC opcional: pasar `subnet_ids` y `security_group_ids` no vacíos.

## Outputs

- `function_arn`, `function_name`, `log_group_name`

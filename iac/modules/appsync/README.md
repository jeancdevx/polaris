# AppSync module

GraphQL API (AWS AppSync) con auth Cognito y resolver Lambda para
`Query.availability` (Redis → RDS fallback).

## Schema

- `Query.availability` → Lambda `appsync-availability` en VPC

## Archivos

| Archivo                    | Responsabilidad                             |
| -------------------------- | ------------------------------------------- |
| `schema.graphql`           | Tipos alineados con `@polaris/shared-types` |
| `api.tf`                   | GraphQL API + API key opcional + logs       |
| `iam-logging.tf`           | Role para field logs en CloudWatch          |
| `datasource.tf`            | Data source Lambda + permiso invoke         |
| `resolver-availability.tf` | Resolver VTL → Lambda                       |

## Uso

```hcl
module "appsync" {
  source = "../../modules/appsync"

  project_name = "polaris"
  environment  = "dev"
  aws_region   = "us-east-2"

  cognito_user_pool_id = module.cognito.user_pool_id

  availability_lambda_function_arn  = module.appsync_availability.function_arn
  availability_lambda_function_name = module.appsync_availability.function_name
}
```

## Smoke

```bash
pnpm --filter @polaris/appsync-availability build
pnpm appsync:smoke:dev
```

## Outputs

- `graphql_endpoint`, `api_id`, `api_arn`
- `api_key` (sensitive, si `create_api_key = true`)

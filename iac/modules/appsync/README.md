# AppSync module

GraphQL API (AWS AppSync) con auth Cognito, API key (smoke) e IAM (backend).
Incluye `Query.availability` y subscriptions `onOccupancyChanged`.

## Schema

- `Query.availability` → Lambda `appsync-availability` en VPC
- `Mutation.publishOccupancyChanged` → datasource NONE (solo IAM)
- `Subscription.onOccupancyChanged` → `@aws_subscribe` sobre la mutation

## Archivos

| Archivo                          | Responsabilidad                             |
| -------------------------------- | ------------------------------------------- |
| `schema.graphql`                 | Tipos alineados con `@polaris/shared-types` |
| `api.tf`                         | GraphQL API + Cognito + IAM + API key       |
| `iam-logging.tf`                 | Role para field logs en CloudWatch          |
| `datasource.tf`                  | Data source Lambda availability             |
| `datasource-none.tf`             | Data source NONE para mutation              |
| `resolver-availability.tf`       | Resolver VTL → Lambda                       |
| `resolver-mutation-occupancy.tf` | Mutation pass-through → subscription        |

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

pnpm --filter @polaris/appsync-occupancy-publisher build
pnpm appsync:subscription:smoke:dev
```

## Outputs

- `graphql_endpoint`, `realtime_endpoint`, `api_id`, `api_arn`
- `api_key` (sensitive, si `create_api_key = true`)

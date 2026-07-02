# AppSync occupancy publisher module

Lambda invocada por EventBridge en `sensor.occupancy` que publica la mutation
`publishOccupancyChanged` en AppSync (auth IAM) para activar la subscription
`onOccupancyChanged`.

## Archivos

| Archivo          | Responsabilidad                                      |
| ---------------- | ---------------------------------------------------- |
| `function.tf`    | Lambda sin VPC                                       |
| `iam-graphql.tf` | Inline policy `appsync:GraphQL` en el role           |
| `build.tf`       | Zip desde `lambdas/appsync-occupancy-publisher/dist` |

## Uso

```hcl
module "appsync_occupancy_publisher" {
  source = "../../modules/appsync-occupancy-publisher"

  project_name = "polaris"
  environment  = "dev"

  lambda_role_arn  = module.iam.appsync_occupancy_publisher_role_arn
  lambda_role_name = module.iam.appsync_occupancy_publisher_role_name

  appsync_api_arn          = module.appsync.api_arn
  appsync_graphql_endpoint = module.appsync.graphql_endpoint
}
```

## Smoke

```bash
pnpm --filter @polaris/appsync-occupancy-publisher build
pnpm appsync:subscription:smoke:dev
```

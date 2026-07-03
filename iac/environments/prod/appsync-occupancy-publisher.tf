module "appsync_occupancy_publisher" {
  source = "../../modules/appsync-occupancy-publisher"

  project_name = var.project_name
  environment  = var.environment

  lambda_role_arn  = module.iam.appsync_occupancy_publisher_role_arn
  lambda_role_name = module.iam.appsync_occupancy_publisher_role_name

  appsync_api_arn          = module.appsync.api_arn
  appsync_graphql_endpoint = module.appsync.graphql_endpoint

  tags = var.tags

  depends_on = [
    module.appsync,
    module.iam,
  ]
}

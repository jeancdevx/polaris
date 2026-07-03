module "appsync" {
  source = "../../modules/appsync"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  cognito_user_pool_id = module.cognito.user_pool_id

  availability_lambda_function_arn  = module.appsync_availability.function_arn
  availability_lambda_function_name = module.appsync_availability.function_name

  tags = var.tags

  depends_on = [
    module.appsync_availability,
    module.cognito,
  ]
}

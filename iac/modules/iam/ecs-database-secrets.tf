locals {
  ecs_database_secret_roles = {
    api_service         = aws_iam_role.ecs_api_service_task.name
    admin_service       = aws_iam_role.ecs_admin_service_task.name
    reservation_service = aws_iam_role.ecs_reservation_service_task.name
    db_bootstrap        = aws_iam_role.ecs_db_bootstrap_task.name
  }
}

resource "aws_iam_role_policy_attachment" "ecs_database_secrets_read" {
  for_each = local.ecs_database_secret_roles

  role       = each.value
  policy_arn = aws_iam_policy.secrets_read.arn
}

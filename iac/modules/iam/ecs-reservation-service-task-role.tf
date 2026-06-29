resource "aws_iam_role" "ecs_reservation_service_task" {
  name_prefix        = "${local.name_prefix}-ecs-rsrv-task-"
  assume_role_policy = data.aws_iam_policy_document.assume_ecs_task.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-reservation-service-task-role"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_reservation_service_msk_client" {
  role       = aws_iam_role.ecs_reservation_service_task.name
  policy_arn = aws_iam_policy.msk_client.arn
}

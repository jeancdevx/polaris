resource "aws_iam_role" "ecs_event_processor_task" {
  name_prefix        = "${local.name_prefix}-ecs-evproc-task-"
  assume_role_policy = data.aws_iam_policy_document.assume_ecs_task.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-event-processor-task-role"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_event_processor_msk_client" {
  role       = aws_iam_role.ecs_event_processor_task.name
  policy_arn = aws_iam_policy.msk_client.arn
}

resource "aws_iam_role_policy_attachment" "ecs_event_processor_eventbridge_publish" {
  role       = aws_iam_role.ecs_event_processor_task.name
  policy_arn = aws_iam_policy.eventbridge_publish.arn
}

resource "aws_iam_role_policy_attachment" "ecs_event_processor_secrets_read" {
  role       = aws_iam_role.ecs_event_processor_task.name
  policy_arn = aws_iam_policy.secrets_read.arn
}

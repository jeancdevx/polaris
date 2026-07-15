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

data "aws_iam_policy_document" "ecs_event_processor_iot_publish" {
  statement {
    effect = "Allow"
    actions = [
      "iot:Publish",
      # Required when PublishCommand uses retain=true (LED state for late subscribers).
      "iot:RetainPublish"
    ]
    resources = [
      "arn:aws:iot:${local.region}:${local.account_id}:topic/parking/commands/led/*",
      "arn:aws:iot:${local.region}:${local.account_id}:topic/parking/commands/display/*"
    ]
  }
}

resource "aws_iam_policy" "ecs_event_processor_iot_publish" {
  name_prefix = "${local.name_prefix}-ecs-evproc-iot-"
  description = "Publish LED commands to AWS IoT Core for event-processor-service"
  policy      = data.aws_iam_policy_document.ecs_event_processor_iot_publish.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-event-processor-iot-publish-policy"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_event_processor_iot_publish" {
  role       = aws_iam_role.ecs_event_processor_task.name
  policy_arn = aws_iam_policy.ecs_event_processor_iot_publish.arn
}

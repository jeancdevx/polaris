data "aws_iam_policy_document" "device" {
  statement {
    effect = "Allow"
    actions = [
      "iot:Connect"
    ]
    resources = [
      "${local.iot_arn_prefix}:client/$${iot:Connection.Thing.ThingName}"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "iot:Publish"
    ]
    resources = [
      "${local.iot_arn_prefix}:topic/parking/rfid/entry/*",
      "${local.iot_arn_prefix}:topic/parking/rfid/exit/*",
      "${local.iot_arn_prefix}:topic/parking/rfid/entry/proximity",
      "${local.iot_arn_prefix}:topic/parking/sensors/occupancy/*",
      "${local.iot_arn_prefix}:topic/parking/commands/servo/*/status",
      "${local.iot_arn_prefix}:topic/parking/commands/display/*/status"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "iot:Subscribe"
    ]
    resources = [
      "${local.iot_arn_prefix}:topicfilter/parking/commands/servo/*",
      "${local.iot_arn_prefix}:topicfilter/parking/commands/display/*",
      "${local.iot_arn_prefix}:topicfilter/parking/commands/led/*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "iot:Receive"
    ]
    resources = [
      "${local.iot_arn_prefix}:topic/parking/commands/servo/*",
      "${local.iot_arn_prefix}:topic/parking/commands/display/*",
      "${local.iot_arn_prefix}:topic/parking/commands/led/*"
    ]
  }
}

resource "aws_iot_policy" "device" {
  name = "${local.name_prefix}-iot-device"

  policy = data.aws_iam_policy_document.device.json
}
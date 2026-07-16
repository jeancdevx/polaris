data "aws_iam_policy_document" "device" {
  for_each = var.devices

  statement {
    effect = "Allow"
    actions = [
      "iot:Connect"
    ]
    resources = [
      "${local.iot_arn_prefix}:client/${local.name_prefix}-${each.key}"
    ]
  }

  dynamic "statement" {
    for_each = contains(["entry-io", "entry-gate"], each.value.role) ? [1] : []

    content {
      effect  = "Allow"
      actions = ["iot:Publish"]
      resources = [
        "${local.iot_arn_prefix}:topic/parking/rfid/entry/${each.value.device_id}",
        "${local.iot_arn_prefix}:topic/parking/rfid/exit/${each.value.device_id}",
        "${local.iot_arn_prefix}:topic/parking/rfid/entry/proximity",
        "${local.iot_arn_prefix}:topic/parking/commands/servo/entry-servo",
        "${local.iot_arn_prefix}:topic/parking/commands/servo/exit-servo"
      ]
    }
  }

  dynamic "statement" {
    for_each = contains(["entry-io", "entry-gate"], each.value.role) ? [1] : []

    content {
      effect  = "Allow"
      actions = ["iot:Subscribe"]
      resources = [
        "${local.iot_arn_prefix}:topicfilter/parking/commands/servo/entry-servo/status",
        "${local.iot_arn_prefix}:topicfilter/parking/commands/servo/exit-servo/status",
        "${local.iot_arn_prefix}:topicfilter/parking/commands/display/entry-lcd"
      ]
    }
  }

  dynamic "statement" {
    for_each = contains(["entry-io", "entry-gate"], each.value.role) ? [1] : []

    content {
      effect  = "Allow"
      actions = ["iot:Receive"]
      resources = [
        "${local.iot_arn_prefix}:topic/parking/commands/servo/entry-servo/status",
        "${local.iot_arn_prefix}:topic/parking/commands/servo/exit-servo/status",
        "${local.iot_arn_prefix}:topic/parking/commands/display/entry-lcd"
      ]
    }
  }

  dynamic "statement" {
    for_each = each.value.role == "actuators" ? [1] : []

    content {
      effect  = "Allow"
      actions = ["iot:Publish"]
      resources = [
        "${local.iot_arn_prefix}:topic/parking/sensors/occupancy/*",
        "${local.iot_arn_prefix}:topic/parking/commands/servo/entry-servo/status",
        "${local.iot_arn_prefix}:topic/parking/commands/servo/exit-servo/status"
      ]
    }
  }

  dynamic "statement" {
    for_each = each.value.role == "actuators" ? [1] : []

    content {
      effect  = "Allow"
      actions = ["iot:Subscribe"]
      resources = [
        "${local.iot_arn_prefix}:topicfilter/parking/commands/servo/entry-servo",
        "${local.iot_arn_prefix}:topicfilter/parking/commands/servo/exit-servo"
      ]
    }
  }

  dynamic "statement" {
    for_each = each.value.role == "actuators" ? [1] : []

    content {
      effect  = "Allow"
      actions = ["iot:Receive"]
      resources = [
        "${local.iot_arn_prefix}:topic/parking/commands/servo/entry-servo",
        "${local.iot_arn_prefix}:topic/parking/commands/servo/exit-servo"
      ]
    }
  }

  dynamic "statement" {
    for_each = each.value.role == "leds-zone" ? [1] : []

    content {
      effect  = "Allow"
      actions = ["iot:Publish"]
      resources = [
        "${local.iot_arn_prefix}:topic/parking/devices/leds/sync-request"
      ]
    }
  }

  dynamic "statement" {
    for_each = each.value.role == "leds-zone" ? [1] : []

    content {
      effect    = "Allow"
      actions   = ["iot:Subscribe"]
      resources = ["${local.iot_arn_prefix}:topicfilter/parking/commands/led/*"]
    }
  }

  dynamic "statement" {
    for_each = each.value.role == "leds-zone" ? [1] : []

    content {
      effect    = "Allow"
      actions   = ["iot:Receive"]
      resources = ["${local.iot_arn_prefix}:topic/parking/commands/led/*"]
    }
  }
}

resource "aws_iot_policy" "device" {
  for_each = var.devices

  name   = "${local.name_prefix}-iot-${each.key}"
  policy = data.aws_iam_policy_document.device[each.key].json
}
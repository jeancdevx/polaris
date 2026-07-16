resource "aws_iot_thing" "device" {
  for_each = var.devices

  name = "${local.name_prefix}-${each.key}"

  attributes = {
    deviceId = each.value.device_id
    role     = each.value.role
  }
}

resource "aws_iot_certificate" "device" {
  for_each = var.devices

  active = true
}

resource "aws_iot_policy_attachment" "device" {
  for_each = var.devices

  policy = aws_iot_policy.device[each.key].name
  target = aws_iot_certificate.device[each.key].arn
}

resource "aws_iot_thing_principal_attachment" "device" {
  for_each = var.devices

  principal = aws_iot_certificate.device[each.key].arn
  thing     = aws_iot_thing.device[each.key].name
}

moved {
  from = aws_iot_certificate.simulator
  to   = aws_iot_certificate.device["entry-gate-01"]
}

moved {
  from = aws_iot_thing.simulator
  to   = aws_iot_thing.device["entry-gate-01"]
}

moved {
  from = aws_iot_policy_attachment.simulator
  to   = aws_iot_policy_attachment.device["entry-gate-01"]
}

moved {
  from = aws_iot_thing_principal_attachment.simulator
  to   = aws_iot_thing_principal_attachment.device["entry-gate-01"]
}

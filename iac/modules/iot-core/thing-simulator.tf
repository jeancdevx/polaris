resource "aws_iot_thing" "simulator" {
  name = local.simulator_thing_name

  attributes = {
    deviceId = var.simulator_device_id
    role     = "entry-gate"
  }
}

resource "aws_iot_thing_principal_attachment" "simulator" {
  principal = aws_iot_certificate.simulator.arn
  thing     = aws_iot_thing.simulator.name
}

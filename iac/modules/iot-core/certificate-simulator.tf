resource "aws_iot_certificate" "simulator" {
  active = true
}

resource "aws_iot_policy_attachment" "simulator" {
  policy = aws_iot_policy.device.name
  target = aws_iot_certificate.simulator.arn
}

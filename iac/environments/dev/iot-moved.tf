moved {
  from = module.iot_core.aws_iot_thing.device["entry-gate-01"]
  to   = module.iot_core.aws_iot_thing.device["entry-io-01"]
}

moved {
  from = module.iot_core.aws_iot_certificate.device["entry-gate-01"]
  to   = module.iot_core.aws_iot_certificate.device["entry-io-01"]
}

moved {
  from = module.iot_core.aws_iot_policy_attachment.device["entry-gate-01"]
  to   = module.iot_core.aws_iot_policy_attachment.device["entry-io-01"]
}

moved {
  from = module.iot_core.aws_iot_thing_principal_attachment.device["entry-gate-01"]
  to   = module.iot_core.aws_iot_thing_principal_attachment.device["entry-io-01"]
}

moved {
  from = module.iot_core.aws_iot_thing.device["exit-gate-01"]
  to   = module.iot_core.aws_iot_thing.device["actuators-01"]
}

moved {
  from = module.iot_core.aws_iot_certificate.device["exit-gate-01"]
  to   = module.iot_core.aws_iot_certificate.device["actuators-01"]
}

moved {
  from = module.iot_core.aws_iot_policy_attachment.device["exit-gate-01"]
  to   = module.iot_core.aws_iot_policy_attachment.device["actuators-01"]
}

moved {
  from = module.iot_core.aws_iot_thing_principal_attachment.device["exit-gate-01"]
  to   = module.iot_core.aws_iot_thing_principal_attachment.device["actuators-01"]
}

moved {
  from = module.iot_core.aws_iot_thing.device["spots-zone-a"]
  to   = module.iot_core.aws_iot_thing.device["leds-zone-a"]
}

moved {
  from = module.iot_core.aws_iot_certificate.device["spots-zone-a"]
  to   = module.iot_core.aws_iot_certificate.device["leds-zone-a"]
}

moved {
  from = module.iot_core.aws_iot_policy_attachment.device["spots-zone-a"]
  to   = module.iot_core.aws_iot_policy_attachment.device["leds-zone-a"]
}

moved {
  from = module.iot_core.aws_iot_thing_principal_attachment.device["spots-zone-a"]
  to   = module.iot_core.aws_iot_thing_principal_attachment.device["leds-zone-a"]
}

moved {
  from = module.iot_core.aws_iot_thing.device["spots-zone-b"]
  to   = module.iot_core.aws_iot_thing.device["leds-zone-b"]
}

moved {
  from = module.iot_core.aws_iot_certificate.device["spots-zone-b"]
  to   = module.iot_core.aws_iot_certificate.device["leds-zone-b"]
}

moved {
  from = module.iot_core.aws_iot_policy_attachment.device["spots-zone-b"]
  to   = module.iot_core.aws_iot_policy_attachment.device["leds-zone-b"]
}

moved {
  from = module.iot_core.aws_iot_thing_principal_attachment.device["spots-zone-b"]
  to   = module.iot_core.aws_iot_thing_principal_attachment.device["leds-zone-b"]
}

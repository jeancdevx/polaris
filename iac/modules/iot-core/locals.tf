locals {
  name_prefix = "${var.project_name}-${var.environment}"

  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.region

  iot_arn_prefix = "arn:aws:iot:${local.region}:${local.account_id}"

  entry_gate_device_key = "entry-gate-01"
}

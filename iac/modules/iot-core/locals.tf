locals {
  name_prefix = "${var.project_name}-${var.environment}"

  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.region

  iot_arn_prefix = "arn:aws:iot:${local.region}:${local.account_id}"

  entry_gate_device_key = "entry-gate-01"
  entry_io_device_key   = "entry-io-01"

  primary_device_key = contains(keys(var.devices), local.entry_io_device_key) ? local.entry_io_device_key : local.entry_gate_device_key
}

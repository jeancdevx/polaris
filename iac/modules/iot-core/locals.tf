locals {
  name_prefix = "${var.project_name}-${var.environment}"

  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.region

  iot_arn_prefix = "arn:aws:iot:${local.region}:${local.account_id}"

  simulator_thing_name = "${local.name_prefix}-${var.simulator_device_id}"
}

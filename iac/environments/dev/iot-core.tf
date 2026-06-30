module "iot_core" {
  source = "../../modules/iot-core"

  project_name = var.project_name
  environment  = var.environment

  rfid_validator_function_arn  = module.rfid_validator.function_arn
  rfid_validator_function_name = module.rfid_validator.function_name

  tags = var.tags

  depends_on = [
    module.rfid_validator,
  ]
}

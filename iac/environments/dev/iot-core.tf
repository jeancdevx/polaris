module "iot_core" {
  source = "../../modules/iot-core"

  project_name = var.project_name
  environment  = var.environment

  rfid_validator_function_arn  = module.rfid_validator.function_arn
  rfid_validator_function_name = module.rfid_validator.function_name

  sensor_data_processor_function_arn  = module.sensor_data_processor.function_arn
  sensor_data_processor_function_name = module.sensor_data_processor.function_name

  tags = var.tags

  depends_on = [
    module.rfid_validator,
    module.sensor_data_processor,
  ]
}

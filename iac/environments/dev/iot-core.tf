module "iot_core" {
  source = "../../modules/iot-core"

  project_name = var.project_name
  environment  = var.environment

  rfid_validator_function_arn  = module.rfid_validator.function_arn
  rfid_validator_function_name = module.rfid_validator.function_name

  sensor_data_processor_function_arn  = module.sensor_data_processor.function_arn
  sensor_data_processor_function_name = module.sensor_data_processor.function_name

  devices = {
    entry-io-01 = {
      device_id = "entry-io-01"
      role      = "entry-io"
    }
    actuators-01 = {
      device_id = "actuators-01"
      role      = "actuators"
    }
    leds-zone-a = {
      device_id = "leds-zone-a"
      role      = "leds-zone"
    }
    leds-zone-b = {
      device_id = "leds-zone-b"
      role      = "leds-zone"
    }
  }

  tags = var.tags

  depends_on = [
    module.rfid_validator,
    module.sensor_data_processor,
  ]
}

# IoT Core module

AWS IoT Core para dispositivos ESP32 — alineado con `docs/arquitectura.md` §11 y
`docs/flujos.md` §1.1.

## Recursos

| Recurso                           | Archivo                    |
| --------------------------------- | -------------------------- |
| Policy dispositivos (`parking/*`) | `policy-device.tf`         |
| Certificado simulador dev         | `certificate-simulator.tf` |
| Thing simulador                   | `thing-simulator.tf`       |
| Rules RFID → `rfid-validator`     | `rules-rfid-validator.tf`  |

## Topics MQTT

| Patrón                         | Uso                        |
| ------------------------------ | -------------------------- |
| `parking/rfid/entry/+`         | Lecturas RFID entrada      |
| `parking/rfid/exit/+`          | Lecturas RFID salida       |
| `parking/rfid/entry/proximity` | HC-SR04 aproximación       |
| `parking/sensors/occupancy/+`  | FC-51 por plaza (Fase 6.4) |
| `parking/commands/servo/+`     | Comandos barrera           |
| `parking/commands/display/+`   | Comandos LCD               |
| `parking/commands/led/+`       | Estado LED remoto          |

## Rules activas (6.3–6.4)

| Regla              | SQL topic                     | Target                |
| ------------------ | ----------------------------- | --------------------- |
| `rfid_entry`       | `parking/rfid/entry/+`        | rfid-validator        |
| `rfid_exit`        | `parking/rfid/exit/+`         | rfid-validator        |
| `sensor_occupancy` | `parking/sensors/occupancy/+` | sensor-data-processor |

Reglas Kafka (`sensor/proximity`) se añaden en fases posteriores.

## Uso

```hcl
module "iot_core" {
  source = "../../modules/iot-core"

  project_name = "polaris"
  environment  = "dev"

  rfid_validator_function_arn  = module.rfid_validator.function_arn
  rfid_validator_function_name = module.rfid_validator.function_name

  depends_on = [module.rfid_validator]
}
```

## Smoke dev

Tras `terraform apply`:

```bash
pnpm iot:smoke:dev
```

Publica un `rfid_scan` simulado por MQTT TLS con el certificado del thing
`{project}-{env}-entry-gate-01` y comprueba en CloudWatch que la IoT rule invocó
`rfid-validator` (`Invocation started`).

Validación RFID completa (`RFID validation completed`) requiere datos seed y
conectividad VPC (RDS/MSK); usar `pnpm rfid-validator:smoke:dev` para ese flujo.

## Outputs

- `data_endpoint` — endpoint ATS para clientes MQTT
- `device_policy_name`, `simulator_thing_name`, `simulator_device_id`
- `simulator_certificate_pem`, `simulator_private_key` (sensitive)
- `rfid_rule_names`, `topic_patterns`

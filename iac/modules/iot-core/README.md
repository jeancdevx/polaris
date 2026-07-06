# IoT Core module

AWS IoT Core para dispositivos ESP32 — alineado con `docs/arquitectura.md` §11 y
`docs/flujos.md` §1.1.

## Recursos

| Recurso                           | Archivo                   |
| --------------------------------- | ------------------------- |
| Policy dispositivos (`parking/*`) | `policy-device.tf`        |
| Things + certificados ESP32       | `devices.tf`              |
| Rules RFID → `rfid-validator`     | `rules-rfid-validator.tf` |

## Dispositivos ESP32 (`var.devices`)

Mapa `for_each`: clave = sufijo del Thing (`entry-gate-01` → Thing
`polaris-dev-entry-gate-01`).

| Entorno      | Dispositivos provisionados                                      |
| ------------ | --------------------------------------------------------------- |
| dev          | 4 (entrada, salida, plazas A, plazas B) — ver `dev/iot-core.tf` |
| staging/prod | 1 por defecto (`entry-gate-01`, smoke tests)                    |

Cada entrada crea: Thing + certificado X.509 + policy attachment + principal
attachment.

**Requisito:** el mapa debe incluir siempre `entry-gate-01` (smoke tests y MQTT
Client ID de referencia).

## Topics MQTT

| Patrón                         | Uso                   |
| ------------------------------ | --------------------- |
| `parking/rfid/entry/+`         | Lecturas RFID entrada |
| `parking/rfid/exit/+`          | Lecturas RFID salida  |
| `parking/rfid/entry/proximity` | HC-SR04 aproximación  |
| `parking/sensors/occupancy/+`  | FC-51 por plaza       |
| `parking/commands/servo/+`     | Comandos barrera      |
| `parking/commands/display/+`   | Comandos LCD          |
| `parking/commands/led/+`       | Estado LED remoto     |

## Rules activas

| Regla              | SQL topic                     | Target                |
| ------------------ | ----------------------------- | --------------------- |
| `rfid_entry`       | `parking/rfid/entry/+`        | rfid-validator        |
| `rfid_exit`        | `parking/rfid/exit/+`         | rfid-validator        |
| `sensor_occupancy` | `parking/sensors/occupancy/+` | sensor-data-processor |

## Uso

```hcl
module "iot_core" {
  source = "../../modules/iot-core"

  project_name = "polaris"
  environment  = "dev"

  rfid_validator_function_arn  = module.rfid_validator.function_arn
  rfid_validator_function_name = module.rfid_validator.function_name

  sensor_data_processor_function_arn  = module.sensor_data_processor.function_arn
  sensor_data_processor_function_name = module.sensor_data_processor.function_name

  # Opcional: los 4 ESP32 (dev). Omitir en prod → solo entry-gate-01.
  devices = {
    entry-gate-01 = { device_id = "entry-gate-01", role = "entry-gate" }
    exit-gate-01  = { device_id = "exit-gate-01",  role = "exit-gate" }
    spots-zone-a  = { device_id = "spots-zone-a",  role = "spots-zone-a" }
    spots-zone-b  = { device_id = "spots-zone-b",  role = "spots-zone-b" }
  }

  depends_on = [module.rfid_validator, module.sensor_data_processor]
}
```

## Certificados para flashear ESP32 (dev)

Tras `terraform apply`:

```bash
cd iac/environments/dev

# Thing name (= MQTT Client ID)
terraform output -json iot_device_thing_names

# Cert + key por dispositivo (sensitive)
terraform output -json iot_device_certificate_pems
terraform output -json iot_device_private_keys
```

Descarga una vez por placa; no commitear. Las claves privadas viven en el state
S3 cifrado.

## Smoke dev

```bash
pnpm iot:smoke:dev
```

Usa outputs legacy `iot_simulator_*` (= `entry-gate-01`).

## Outputs

- `data_endpoint` — endpoint ATS MQTT (`:8883`)
- `device_thing_names`, `device_certificate_pems`, `device_private_keys`
- `simulator_*` — alias de `entry-gate-01` (scripts existentes)
- `rfid_rule_names`, `topic_patterns`

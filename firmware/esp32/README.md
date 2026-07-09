# ESP32 Firmware (PlatformIO)

Firmware para los **4 nodos** Polaris. Ver `docs/flujos.md`.

## Entornos PlatformIO

| Env           | `deviceId`     | Thing AWS (dev)            | Hardware                                   |
| ------------- | -------------- | -------------------------- | ------------------------------------------ |
| `entry_io`    | `entry-io-01`  | `polaris-dev-entry-io-01`  | 2× RFID (entrada/salida), LCD I2C, HC-SR04 |
| `actuators`   | `actuators-01` | `polaris-dev-actuators-01` | 2× SG90, 10× FC-51 (spots 1–10)            |
| `leds_zone_a` | `leds-zone-a`  | `polaris-dev-leds-zone-a`  | RGB plazas 1–5                             |
| `leds_zone_b` | `leds-zone-b`  | `polaris-dev-leds-zone-b`  | RGB plazas 6–10                            |

Cada placa necesita **su propio certificado** en `polaris_device.h` (Thing name
= client id MQTT).

## Build / flash

```bash
cd firmware/esp32
pio run -e actuators -t upload
pio device monitor
```

## Configuración AWS / WiFi

Copiar `include/polaris_device.h.example` → `include/polaris_device.h`
(gitignored).

Tras `terraform apply` en dev:

```bash
cd firmware/esp32
./scripts/write-config-from-terraform.sh actuators-01
# Pegar PEM cert/key del output indicado
```

Claves disponibles: `entry-io-01`, `actuators-01`, `leds-zone-a`, `leds-zone-b`.

## Mapa de pines

Editar `include/pins_*.h` según cableado.

| Board     | Archivo            |
| --------- | ------------------ |
| entry_io  | `pins_entry_io.h`  |
| actuators | `pins_actuators.h` |
| leds      | `pins_leds.h`      |

### `entry_io` — 2× RC522 (SPI compartido)

| Señal    | Entrada | Salida  | Compartido |
| -------- | ------- | ------- | ---------- |
| SCK      | —       | —       | GPIO 18    |
| MISO     | —       | —       | GPIO 19    |
| MOSI     | —       | —       | GPIO 23    |
| SS (SDA) | GPIO 5  | GPIO 4  | —          |
| RST      | GPIO 27 | GPIO 15 | —          |

La librería MFRC522 usa `MFRC522(SS, RST)` — SS/SDA primero, RST segundo.

HC-SR04: TRIG=17, ECHO=16. LCD I2C: SDA=21, SCL=22.

Si el serial muestra siempre `distance=999 cm`, el sensor no responde: revisar
alimentación 5 V, GND común con el ESP32, y divisor de tensión en ECHO (el pin
ECHO del HC-SR04 es 5 V; el ESP32 acepta 3,3 V máx.). Para depurar:

```bash
pio run -e entry_io_debug -t upload && pio device monitor
```

Cada 5 s verás `[entry_io] Ultrasonic distance=… cm` en el monitor serial.

FC-51: **LOW** = obstáculo. Sin sensor cableado, usar `INPUT_PULLUP` o no
alimentar el ESP (pines flotantes → falsas ocupaciones en AWS).

## Smoke desde PC

```bash
pnpm iot:smoke:dev
```

## Importante (dev)

El ESP **actuators** publica `occupancy_changed` a IoT Core → actualiza
Redis/RDS en AWS. Sin FC-51 reales, corre **DB reset dev** en GitHub Actions
tras pruebas de banco.

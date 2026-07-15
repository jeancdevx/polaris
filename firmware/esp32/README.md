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
| RST      | GPIO 27 | GPIO 26 | —          |

**Importante:** no uses GPIO 15 como RST del lector de salida — es pin de
_strapping_ en el ESP32 y el RC522 suele reportar `Firmware Version: 0x0` /
`Communication failure` aunque el cableado SPI esté bien.

La librería MFRC522 usa `MFRC522(SS, RST)` — SS/SDA primero, RST segundo.

HC-SR04: **TRIG=GPIO 33**, **ECHO=GPIO 32** (GPIO 16/17 no usables en esta
placa). LCD I2C: SDA=21, SCL=22.

Si el serial muestra siempre `distance=999 cm` y `echo_us=0`, el ESP32 no recibe
pulso en ECHO: revisar cableado TRIG/ECHO, alimentación **5 V** en VCC del
HC-SR04, GND común con el ESP32, y divisor de tensión en ECHO (salida 5 V → 3,3
V en GPIO 32). Para depurar:

```bash
pio run -e entry_io_debug -t upload && pio device monitor
```

Cada 5 s verás `[entry_io] Ultrasonic TRIG=… ECHO=… echo_us=… distance=… cm`.

**Flujo entrada:** HC-SR04 detecta vehículo a ≤12 cm → LCD pide tarjeta → el
RC522 de entrada publica el RFID (se mantiene armado con histéresis hasta 25
cm). Lambda valida → MQTT abre servo en `actuators`. Monitorea **entry_io** (no
actuators) para ver proximidad/RFID. Pasar la tarjeta sin proximidad imprime
`Entry RFID ignored — vehiculo debe estar a <=12cm`. Timeouts HC
(`distance=999`) no desarman presencia de inmediato.

### `actuators` — servos + FC-51

| Señal         | GPIO |
| ------------- | ---- |
| Servo entrada | 13   |
| Servo salida  | 12   |

Los servos **solo se mueven** al recibir MQTT
`parking/commands/servo/{entry-servo|exit-servo}` con `"action":"open"` o
`"close"` (Lambda abre; `entry_io` cierra). Payload mínimo: `{"action":"open"}`
— **no** envíes `"angle":90` si compilaste con `POLARIS_SERVO_INVERT`
(closed=90°, open=0°).

Si al flashear **se levantan solos**, el montaje suele invertir 0°/90°. En
`[env:actuators]` ya va `-D POLARIS_SERVO_INVERT=1`. Si en tu banco fuera al
revés, quita esa flag y recompila.

El firmware ignora MQTT `open` durante 4 s tras boot y exige `"action"`
explícito. Serial esperado en **actuators** al abrir:

```
[mqtt] Subscribe parking/commands/servo/entry-servo -> ok
[actuators] Cmd queued entry-servo action=open angle=-1
[servo] write pin=13 angle=0
[actuators] Servo entry-servo opened (angle=0 pin=13)
```

Si ves `attach FAILED` / `PWM not attached`, revisa alimentación 5 V del SG90
(GND común) y GPIO 12/13. GPIO 12 es strapping — si el de salida no arranca
bien, cambia `kExitServo` en `pins_actuators.h`.

FC-51: **LOW** = obstáculo. Sin sensor cableado, usar `INPUT_PULLUP` o no
alimentar el ESP (pines flotantes → falsas ocupaciones en AWS).

### `leds_zone_a` / `leds_zone_b` — RGB por plaza

Cada plaza usa los 3 canales del LED (cátodo común: HIGH = encendido):

| Estado RDS / MQTT `mode`  | Color                     | Canales RGB |
| ------------------------- | ------------------------- | ----------- |
| `free`                    | Verde fijo                | G           |
| `reserved` / `blink_blue` | Azul parpadeante (500 ms) | B           |
| `occupied`                | Rojo fijo                 | R           |
| `off`                     | Apagado                   | —           |

`blink_green` sigue aceptándose en firmware (alias legacy → azul parpadeante).

## Smoke desde PC

```bash
pnpm iot:smoke:dev
```

## Importante (dev)

El ESP **actuators** publica `occupancy_changed` a IoT Core → actualiza
Redis/RDS en AWS. Sin FC-51 reales, corre **DB reset dev** en GitHub Actions
tras pruebas de banco.

# ESP32 Firmware (PlatformIO)

Firmware para los **4 nodos** Polaris. Ver `docs/flujos.md`.

## Entornos PlatformIO

| Env           | `deviceId`     | Thing AWS (dev)            | Hardware                                   |
| ------------- | -------------- | -------------------------- | ------------------------------------------ |
| `entry_io`    | `entry-io-01`  | `polaris-dev-entry-io-01`  | 2× RFID (entrada/salida), LCD I2C, HC-SR04 |
| `actuators`   | `actuators-01` | `polaris-dev-actuators-01` | 2× SG90, 10× FC-51 (spots 1–10)            |
| `leds_zone_a` | `leds-zone-a`  | `polaris-dev-leds-zone-a`  | RGB plazas 1–5                             |
| `leds_zone_b` | `leds-zone-b`  | `polaris-dev-leds-zone-b`  | RGB plazas 6–10                            |

Cada placa necesita **su propio certificado y header**:
`polaris_device.entry_io.h`, `polaris_device.actuators.h`,
`polaris_device.leds_zone_a.h` o `polaris_device.leds_zone_b.h`. El Thing name
debe terminar en el `deviceId`; el firmware rechaza la conexión MQTT si no
coincide.

## Build / flash

```bash
cd firmware/esp32
# CI/compile check: compila todos los entornos de default_envs, no flashea.
pio run

# Flash supervisado de una placa concreta.
pio run -e actuators -t upload
pio device monitor
```

## Configuración AWS / WiFi

El script crea el header ignorado correcto a partir de
`include/polaris_device.h.example`. No reutilizar el header, certificado o clave
de otra placa.

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
| Servo salida  | 22   |

Los servos se adjuntan **después** de WiFi (si no, el PWM LEDC queda mudo).
Adjuntar o reconectar **no mueve** las barreras: se publica `status:"unknown"`
con `result:"ready"` hasta recibir un comando válido. Luego MQTT
`parking/commands/servo/{entry-servo|exit-servo}` con `"action":"open"|"close"`
(Lambda abre; `entry_io` cierra). Los comandos nuevos incluyen un `commandId`
estable; firmware sigue aceptando payloads legacy sin ID y los etiqueta
`commandIdSource:"legacy-missing"`.

Payload recomendado:

```json
{
  "deviceId": "entry-servo",
  "action": "open",
  "commandId": "rfid:entry-io-01:entry:A3:BF:22:01:1784145600000",
  "timestamp": 1784145600000
}
```

`action` solo acepta `open` o `close`; `angle`, si se incluye, debe ser entero
entre 0 y 180. El status conserva el topic existente y responde con
`result:"applied"|"rejected"|"duplicate"`, `action`, `angle` y `commandId`. Los
IDs repetidos se deduplican en RAM (se reinician al reboot). `entry_io`
reintenta cada cierre con el mismo ID hasta recibir un acknowledgement
correlacionado `closed/applied` o `closed/duplicate`; esto compensa la
publicación QoS 0 de PubSubClient sin ejecutar el movimiento dos veces.

Alimentación: **VCC del SG90 a 5 V externo** (no al 3.3V del ESP), **GND común**
con el ESP, señal a GPIO 13/22.

El self-test open→close está desactivado en builds normales. Solo para una
prueba supervisada, compilar `actuators` agregando temporalmente
`-D POLARIS_SERVO_SELF_TEST` a sus `build_flags`; no dejar esa flag en CI ni en
firmware operativo.

Serial esperado en **actuators** al abrir:

```
[actuators] Pins entry=13 exit=22 attached=1/1
[actuators] Cmd queued entry-servo action=open angle=-1 id=rfid:...
[servo] write pin=13 angle=0 us=500
[actuators] Servo entry-servo opened (angle=0 pin=13)
```

FC-51: **LOW** = obstáculo. Sin sensor cableado, usar `INPUT_PULLUP` o no
alimentar el ESP (pines flotantes → falsas ocupaciones en AWS).

#### Checklist HIL supervisado

1. Desconectar brazos/carga mecánica; verificar VCC 5 V externo, GND común y
   señales GPIO 13/22. Mantener una persona junto al corte de alimentación.
2. Arrancar firmware normal y confirmar que ninguna barrera se mueve; serial
   debe indicar `unknown/ready` y que el self-test está desactivado.
3. Con MQTT conectado, enviar un comando inválido y uno con `angle` fuera de
   0..180; confirmar `rejected` y ausencia de movimiento.
4. Enviar `close` con un `commandId` nuevo antes de montar los brazos; confirmar
   `applied`, ángulo cerrado y eco exacto del ID.
5. Repetir el mismo payload; confirmar `duplicate` y ausencia de un segundo
   `write` del servo.
6. Cortar/restaurar WiFi y MQTT con una barrera en posición conocida; confirmar
   reattach `unknown/ready` sin movimiento automático.
7. Enviar `open` y luego `close` con IDs distintos, observando recorrido, topes
   y corriente. Detener ante vibración, atasco o sobrecorriente.
8. Solo si hace falta validar cableado sin MQTT, habilitar
   `POLARIS_SERVO_SELF_TEST`, despejar físicamente ambas barreras y repetir con
   supervisión. Retirar la flag al terminar.

#### Checklist HIL `entry_io` (RFID + HC + LCD)

1. Con vehículo a ≤12 cm, LCD muestra `Vehiculo detectado` / `Acerque tarjeta`.
2. Primera tarjeta válida → `Validando...` / `Espere`; solo una lectura por
   ciclo de presencia (reintentos ignorados hasta que el HC confirme salida).
3. Tras abrir/cerrar barrera con vehículo aún presente, LCD muestra
   `Paso en curso` / `Espere salida` y el lector de salida no publica otra
   tarjeta.
4. Cuando el HC confirma salida (`Proximity cleared`), el ciclo se resetea y el
   LCD vuelve a idle con libres.
5. Denegaciones cloud (`Tarjeta no registrada`, etc.) permanecen ~8 s sin ser
   pisadas por mensajes locales.

#### Checklist HIL LEDs (`leds_zone_a` / `leds_zone_b`)

1. Serial debe mostrar `[mqtt] Connected`, subscribe
   `parking/commands/led/+ -> ok` y `cloud sync requested`.
2. Tras reservar una plaza en web/app, serial debe mostrar
   `[leds] cloud spot-XX -> blink_blue (blue)`.
3. Tras ocupación FC-51 o ingreso RFID, serial debe mostrar `occupied (red)`.
4. Al liberar plaza, serial debe mostrar `free (green/off)`.
5. Si los LEDs siguen verdes pero el serial recibe comandos, revisar cableado
   RGB (cátodo común, HIGH = encendido) contra `pins_leds.h`.

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

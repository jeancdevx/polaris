# ESP32 Firmware (PlatformIO)

Firmware Fase 10.3 para los 4 nodos Polaris. Ver `docs/flujos.md`.

## Entornos

| Env      | Nodo            | Hardware                      | Plazas MQTT           |
| -------- | --------------- | ----------------------------- | --------------------- |
| `entry`  | `entry-gate-01` | HC-SR04, RC522, SG90, LCD I2C | —                     |
| `exit`   | `exit-gate-01`  | RC522, SG90                   | —                     |
| `zone_a` | `spots-zone-a`  | 4× FC-51, 4× RGB              | `spot-01` … `spot-04` |
| `zone_b` | `spots-zone-b`  | 4× FC-51, 4× RGB              | `spot-07` … `spot-10` |

`spot-05` y `spot-06` no tienen sensor en hardware (8 plazas instrumentadas de
10 lógicas).

## Build / flash

```bash
cd firmware/esp32
pio run -e entry          # compilar entrada
pio run -e entry -t upload
pio device monitor
```

## Configuración AWS / WiFi

Copiar `include/polaris_device.h.example` → `include/polaris_device.h`
(gitignored).

PEMs como `static const char[] = R"EOF(...)EOF";` — ver comentarios en el
example.

```bash
./scripts/write-config-from-terraform.sh entry-gate-01
```

## Mapa de pines (ESP32 DevKit V1)

Editar `include/pins_*.h` si tu cableado difiere.

### Entrada (`pins_entry.h`)

| Componente | Pines                                  |
| ---------- | -------------------------------------- |
| RC522 SPI  | SS=5, RST=27, SCK=18, MISO=19, MOSI=23 |
| HC-SR04    | TRIG=17, ECHO=16                       |
| SG90       | 13                                     |
| LCD I2C    | SDA=21, SCL=22, addr `0x27`            |

### Salida (`pins_exit.h`)

| Componente | Pines             |
| ---------- | ----------------- |
| RC522 SPI  | igual que entrada |
| SG90       | 13                |

### Zonas A/B (`pins_zone.h`) — 16 GPIO

| Slot | FC-51 | RGB (R,G,B) | zone_a spot | zone_b spot |
| ---- | ----- | ----------- | ----------- | ----------- |
| 0    | 32    | 14, 27, 26  | spot-01     | spot-07     |
| 1    | 33    | 17, 16, 4   | spot-02     | spot-08     |
| 2    | 25    | 18, 19, 21  | spot-03     | spot-09     |
| 3    | 35    | 22, 23, 5   | spot-04     | spot-10     |

FC-51: **LOW** = obstáculo. RGB cátodo común: HIGH enciende color.

## Estructura código

```
include/           Config, pines, headers drivers
src/common/        Drivers (wifi, RFID, ultrasonic, servo, LCD, FC-51, RGB)
src/entry/         Flujo ingreso (proximidad + RFID + barrera segura)
src/exit/          Flujo salida (RFID + barrera heurística)
src/zone/          Ocupación FC-51 + LEDs + MQTT
```

## Comportamiento (resumen)

**Entrada:** HC-SR04 cada 200 ms → `proximity_detected`; RC522 → `rfid_scan`;
comandos MQTT servo/LCD; cierre barrera solo con zona despejada (>50 cm, 500
ms).

**Salida:** RC522 → `rfid_scan`; apertura por MQTT; cierre a los 6 s sin nueva
lectura (mín. 2 s abierta, máx. 60 s).

**Zona:** FC-51 con debounce 300 ms → `occupancy_changed`; LED
verde/rojo/parpadeo por comando `parking/commands/led/{spotId}`.

## Smoke desde PC

```bash
pnpm iot:smoke:dev
```

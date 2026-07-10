#pragma once

// ESP32 entrada IO — 2× RC522 (SPI compartido), LCD I2C, HC-SR04.
// Este ESP32 NO controla servos ni FC-51 (eso va en `actuators`).

namespace polaris::pins::entry_io {

// Bus SPI compartido por ambos RC522
constexpr int kRfidSck = 18;
constexpr int kRfidMiso = 19;
constexpr int kRfidMosi = 23;

// RC522 entrada (barrera de ingreso)
constexpr int kRfidEntrySs = 5;
constexpr int kRfidEntryRst = 27;

// RC522 salida (barrera de egreso) — SS/RST propios, mismo bus SPI
constexpr int kRfidExitSs = 4;
constexpr int kRfidExitRst = 15;

// HC-SR04 (solo entrada) — GPIO 16/17 no disponibles en esta placa
constexpr int kUltrasonicTrig = 33;
constexpr int kUltrasonicEcho = 32;

// LCD 16x2 I2C (PCF8574 — dirección 0x27 o 0x3F)
constexpr int kLcdSda = 21;
constexpr int kLcdScl = 22;
constexpr uint8_t kLcdAddress = 0x27;

}  // namespace polaris::pins::entry_io

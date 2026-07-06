#pragma once

// ESP32 entrada — HC-SR04, RC522 (SPI), SG90, LCD I2C
// Ajusta si tu cableado difiere.

namespace polaris::pins::entry {

// RC522 SPI
constexpr int kRfidSs = 5;
constexpr int kRfidRst = 27;
constexpr int kRfidSck = 18;
constexpr int kRfidMiso = 19;
constexpr int kRfidMosi = 23;

// HC-SR04
constexpr int kUltrasonicTrig = 17;
constexpr int kUltrasonicEcho = 16;

// SG90 barrera entrada
constexpr int kServo = 13;

// LCD 16x2 I2C (PCF8574 — dirección 0x27 o 0x3F)
constexpr int kLcdSda = 21;
constexpr int kLcdScl = 22;
constexpr uint8_t kLcdAddress = 0x27;

}  // namespace polaris::pins::entry

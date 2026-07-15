#pragma once

// ESP32 LEDs — solo LEDs RGB para plazas.
// Cada build define POLARIS_SPOT_FIRST..POLARIS_SPOT_LAST (5 plazas por ESP32).

namespace polaris::pins::leds {

constexpr int kSpotCount = 5;

struct RgbPins {
  int r;
  int g;
  int b;
};

// RGB discreto (3 pines c/u). Misma asignación en zone_a y zone_b (placas distintas).
constexpr RgbPins kRgb[kSpotCount] = {
    {17, 16, 4},
    {19, 18, 5},
    {27, 14, 12},
    {33, 25, 26},
    {34, 35, 32},
};

}  // namespace polaris::pins::leds

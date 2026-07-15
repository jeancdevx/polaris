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
    {14, 27, 26},
    {17, 16, 4},
    {18, 19, 21},
    {22, 23, 5},
    {32, 33, 25},
};

}  // namespace polaris::pins::leds

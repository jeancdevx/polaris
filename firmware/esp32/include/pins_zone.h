#pragma once

// 4× FC-51 + 4× RGB discreto (3 pines c/u) = 16 GPIO — cabe en ~19 disponibles.
// Misma asignación en zone_a y zone_b (placas distintas).

namespace polaris::pins::zone {

constexpr int kSpotCount = 4;

// FC-51 OUT → obstáculo = LOW
constexpr int kFc51[kSpotCount] = {32, 33, 25, 35};

struct RgbPins {
  int r;
  int g;
  int b;
};

constexpr RgbPins kRgb[kSpotCount] = {
    {14, 27, 26},
    {17, 16, 4},
    {18, 19, 21},
    {22, 23, 5},
};

}  // namespace polaris::pins::zone

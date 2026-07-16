#pragma once

namespace polaris::pins::actuators {

// Evitar GPIO 12 (strapping / flash voltage). Señal SG90 a 3.3V OK.
constexpr int kEntryServo = 13;
constexpr int kExitServo = 22;

// FC-51 OUT → obstáculo = LOW
// 10 plazas totales: 1..10
constexpr int kFc51Count = 10;

// Orden: [1,2,3,4,5,6,7,8,9,10]
constexpr int kFc51SpotNumbers[kFc51Count] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
// Importante: evita GPIO reservados / de arranque según tu ESP32 devkit.
constexpr int kFc51Pins[kFc51Count] = {32, 33, 25, 35, 26, 27, 14, 4, 18, 19};

}  // namespace polaris::pins::actuators

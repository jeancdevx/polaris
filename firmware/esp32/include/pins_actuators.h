#pragma once

namespace polaris::pins::actuators {

// Servos (SG90)
constexpr int kEntryServo = 18;
constexpr int kExitServo = 19;

// FC-51 OUT → obstáculo = LOW
// 10 plazas totales: 1..10
constexpr int kFc51Count = 10;

// Orden: [1,2,3,4,5,6,7,8,9,10]
constexpr int kFc51SpotNumbers[kFc51Count] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
// Importante: evita GPIO reservados / de arranque según tu ESP32 devkit.
constexpr int kFc51Pins[kFc51Count] = {35, 32, 33, 25, 26, 27, 14, 15, 2, 4};

}  // namespace polaris::pins::actuators

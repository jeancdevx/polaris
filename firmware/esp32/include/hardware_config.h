#pragma once

namespace polaris::hw {

// HC-SR04 (entry)
constexpr int kApproachCm = 20;
constexpr int kAtGateCm = 10;
constexpr int kSafetyBlockCm = 15;
constexpr int kClearedCm = 50;
constexpr unsigned long kUltrasonicPollMs = 200;
constexpr unsigned long kClearedHoldMs = 500;
constexpr unsigned long kProximityTimeoutMs = 30'000;
constexpr unsigned long kBarrierMaxOpenMs = 120'000;
constexpr unsigned long kPassageTelemetryMs = 1'000;

// SG90 — si la barrera se levanta al arrancar, compilar actuators con
// -D POLARIS_SERVO_INVERT=1 en platformio.ini
#if defined(POLARIS_SERVO_INVERT)
constexpr int kServoClosedAngle = 90;
constexpr int kServoOpenAngle = 0;
#else
constexpr int kServoClosedAngle = 0;
constexpr int kServoOpenAngle = 90;
#endif

constexpr unsigned long kServoBootGraceMs = 4'000;

// Exit gate heuristic (no ultrasonic)
constexpr unsigned long kExitMinOpenMs = 3'000;
constexpr unsigned long kExitCloseAfterMs = 15'000;
constexpr unsigned long kExitMaxOpenMs = 60'000;

// FC-51 zone sensors
constexpr unsigned long kFc51DebounceMs = 300;
constexpr unsigned long kZonePollMs = 100;

// RGB reserved blink
constexpr unsigned long kLedBlinkMs = 500;

// RFID
constexpr unsigned long kRfidCooldownMs = 2'000;

}  // namespace polaris::hw

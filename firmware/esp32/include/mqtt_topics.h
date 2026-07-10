#pragma once

#include <Arduino.h>

namespace polaris::mqtt {

inline String rfidEntryTopic(const char* deviceId) {
  return String("parking/rfid/entry/") + deviceId;
}

inline String rfidExitTopic(const char* deviceId) {
  return String("parking/rfid/exit/") + deviceId;
}

constexpr const char* kRfidEntryProximityTopic = "parking/rfid/entry/proximity";

inline String occupancyTopic(const char* spotId) {
  return String("parking/sensors/occupancy/") + spotId;
}

inline String servoCommandTopic(const char* servoId) {
  return String("parking/commands/servo/") + servoId;
}

inline String servoStatusTopic(const char* servoId) {
  return String("parking/commands/servo/") + servoId + "/status";
}

inline String displayCommandTopic(const char* displayId) {
  return String("parking/commands/display/") + displayId;
}

inline String ledCommandTopic(const char* spotId) {
  return String("parking/commands/led/") + spotId;
}

constexpr const char* kLedSyncRequestTopic = "parking/devices/leds/sync-request";

}  // namespace polaris::mqtt

#include <Arduino.h>
#include <ArduinoJson.h>

#include "fc51_sensor.h"
#include "hardware_config.h"
#include "mqtt_topics.h"
#include "pins_actuators.h"
#include "polaris_config.h"
#include "polaris_time.h"
#include "role_info.h"
#include "servo_barrier.h"
#include "wifi_mqtt.h"

// Este firmware corre en el ESP32 #2:
// - Controla 2 servos (entrada + salida)
// - Lee FC-51 (ocupación) y publica occupancy_changed para spots 1..10

namespace {

WifiMqttClient* gClient = nullptr;
ServoBarrier gEntryServo(polaris::pins::actuators::kEntryServo);
ServoBarrier gExitServo(polaris::pins::actuators::kExitServo);

struct Fc51Spot {
  int spotNumber;
  Fc51Sensor sensor;
  bool confirmedOccupied = false;
  bool pendingOccupied = false;
  unsigned long pendingSinceMs = 0;
  bool debouncing = false;
};

Fc51Spot gSpots[polaris::pins::actuators::kFc51Count] = {
    {polaris::pins::actuators::kFc51SpotNumbers[0],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[0])},
    {polaris::pins::actuators::kFc51SpotNumbers[1],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[1])},
    {polaris::pins::actuators::kFc51SpotNumbers[2],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[2])},
    {polaris::pins::actuators::kFc51SpotNumbers[3],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[3])},
    {polaris::pins::actuators::kFc51SpotNumbers[4],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[4])},
    {polaris::pins::actuators::kFc51SpotNumbers[5],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[5])},
    {polaris::pins::actuators::kFc51SpotNumbers[6],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[6])},
    {polaris::pins::actuators::kFc51SpotNumbers[7],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[7])},
    {polaris::pins::actuators::kFc51SpotNumbers[8],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[8])},
    {polaris::pins::actuators::kFc51SpotNumbers[9],
     Fc51Sensor(polaris::pins::actuators::kFc51Pins[9])},
};

unsigned long gLastZonePollMs = 0;
unsigned long gBootMs = 0;

struct PendingServoCommand {
  bool pending = false;
  char action[8] = {};
  int angle = -1;  // <0 → use hardware default for action
};

PendingServoCommand gPendingEntry;
PendingServoCommand gPendingExit;

String spotIdFromNumber(int spotNumber) {
  char buffer[12];
  snprintf(buffer, sizeof(buffer), "spot-%02d", spotNumber);
  return String(buffer);
}

void publishServoStatus(const char* servoId, const char* status, const char* reason) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = servoId;
  doc["status"] = status;
  doc["close_reason"] = reason;
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::servoStatusTopic(servoId).c_str(), doc);
}

void queueServoCommand(PendingServoCommand& slot, const char* action, int angle) {
  slot.pending = true;
  strncpy(slot.action, action, sizeof(slot.action) - 1);
  slot.action[sizeof(slot.action) - 1] = '\0';
  slot.angle = angle;
}

void applyServoCommand(const char* servoId, ServoBarrier& servo, PendingServoCommand& slot) {
  if (!slot.pending) {
    return;
  }
  slot.pending = false;

  if (strcmp(slot.action, "open") == 0) {
    if (millis() - gBootMs < polaris::hw::kServoBootGraceMs) {
      Serial.printf("[actuators] Ignored open for %s during boot grace\n", servoId);
      return;
    }

    const int angle =
        slot.angle >= 0 ? slot.angle : polaris::hw::kServoOpenAngle;
    if (!servo.setAngle(angle)) {
      Serial.printf("[actuators] Servo %s OPEN failed (PWM not attached)\n", servoId);
      return;
    }
    publishServoStatus(servoId, "open", "command");
    Serial.printf("[actuators] Servo %s opened (angle=%d pin=%d)\n",
                  servoId,
                  angle,
                  servo.pin());
    return;
  }

  if (strcmp(slot.action, "close") == 0) {
    const int angle =
        slot.angle >= 0 ? slot.angle : polaris::hw::kServoClosedAngle;
    if (!servo.setAngle(angle)) {
      Serial.printf("[actuators] Servo %s CLOSE failed (PWM not attached)\n", servoId);
      return;
    }
    publishServoStatus(servoId, "closed", "command");
    Serial.printf("[actuators] Servo %s closed (angle=%d pin=%d)\n",
                  servoId,
                  angle,
                  servo.pin());
    return;
  }

  Serial.printf("[actuators] Ignored servo command for %s (action=%s)\n",
                servoId,
                slot.action);
}

void forceServosClosedOnBoot(const char* reason) {
  const bool entryOk = gEntryServo.close();
  const bool exitOk = gExitServo.close();
  if (entryOk) {
    publishServoStatus(POLARIS_ENTRY_SERVO_ID, "closed", reason);
  }
  if (exitOk) {
    publishServoStatus(POLARIS_EXIT_SERVO_ID, "closed", reason);
  }
  Serial.printf("[actuators] Servos forced closed (%s) entry_ok=%d exit_ok=%d\n",
                reason,
                entryOk ? 1 : 0,
                exitOk ? 1 : 0);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  // Status feedback must not be treated as a command.
  if (strstr(topic, "/status") != nullptr) {
    return;
  }
  if (strstr(topic, "/servo/") == nullptr) {
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, reinterpret_cast<const char*>(payload), length)) {
    Serial.println("[actuators] Ignored servo command (JSON parse error)");
    return;
  }

  const char* action = doc["action"] | "";
  const int angle = doc["angle"] | -1;

  if (strstr(topic, POLARIS_ENTRY_SERVO_ID) != nullptr) {
    Serial.printf("[actuators] Cmd queued %s action=%s angle=%d\n",
                  POLARIS_ENTRY_SERVO_ID,
                  action,
                  angle);
    queueServoCommand(gPendingEntry, action, angle);
    return;
  }

  if (strstr(topic, POLARIS_EXIT_SERVO_ID) != nullptr) {
    Serial.printf("[actuators] Cmd queued %s action=%s angle=%d\n",
                  POLARIS_EXIT_SERVO_ID,
                  action,
                  angle);
    queueServoCommand(gPendingExit, action, angle);
  }
}

WifiMqttConfig makeConfig() {
  return WifiMqttConfig{
      .wifiSsid = POLARIS_WIFI_SSID,
      .wifiPassword = POLARIS_WIFI_PASSWORD,
      .iotEndpoint = POLARIS_IOT_ENDPOINT,
      .thingName = POLARIS_IOT_THING_NAME,
      .deviceCertPem = POLARIS_IOT_DEVICE_CERT,
      .deviceKeyPem = POLARIS_IOT_DEVICE_PRIVATE_KEY,
      .rootCaPem = POLARIS_IOT_ROOT_CA,
      .onMessage = onMqttMessage,
  };
}

void subscribeCommands(WifiMqttClient& client) {
  client.subscribe(polaris::mqtt::servoCommandTopic(POLARIS_ENTRY_SERVO_ID).c_str());
  client.subscribe(polaris::mqtt::servoCommandTopic(POLARIS_EXIT_SERVO_ID).c_str());
}

bool publishOccupancy(int spotNumber, bool occupied) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return false;
  }

  const String spotId = spotIdFromNumber(spotNumber);
  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["spotId"] = spotId;
  doc["event"] = "occupancy_changed";
  doc["status"] = occupied ? "occupied" : "free";
  doc["sensorType"] = "fc-51";
  doc["timestamp"] = polaris::time::nowEpochMs();

  const bool ok =
      gClient->publishJson(polaris::mqtt::occupancyTopic(spotId.c_str()).c_str(), doc);
  Serial.printf("[actuators] Occupancy %s -> %s\n", spotId.c_str(), occupied ? "occupied" : "free");
  return ok;
}

void republishAllSpotStates() {
  for (const auto& spot : gSpots) {
    publishOccupancy(spot.spotNumber, spot.confirmedOccupied);
  }
}

void updateSpot(Fc51Spot& spot, unsigned long nowMs) {
  const bool obstacle = spot.sensor.readObstacle();

  if (!spot.debouncing) {
    if (obstacle != spot.confirmedOccupied) {
      spot.debouncing = true;
      spot.pendingOccupied = obstacle;
      spot.pendingSinceMs = nowMs;
    }
    return;
  }

  if (obstacle != spot.pendingOccupied) {
    spot.debouncing = false;
    return;
  }

  if (nowMs - spot.pendingSinceMs < polaris::hw::kFc51DebounceMs) {
    return;
  }

  spot.debouncing = false;
  spot.confirmedOccupied = spot.pendingOccupied;
  publishOccupancy(spot.spotNumber, spot.confirmedOccupied);
}

void ensureMqtt() {
  if (gClient == nullptr) {
    return;
  }

  if (!gClient->isMqttConnected()) {
    if (gClient->connectWifi()) {
      polaris::time::syncFromNtp();
      if (gClient->connectMqtt()) {
        subscribeCommands(*gClient);
        republishAllSpotStates();
      }
    }
  }
  gClient->loop();
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);
  gBootMs = millis();

  Serial.printf("\nPolaris ESP32 — role=%s deviceId=%s\n", kRoleName, POLARIS_DEVICE_ID);

  gEntryServo.begin();
  gExitServo.begin();
  forceServosClosedOnBoot("setup");

  for (auto& spot : gSpots) {
    spot.sensor.begin();
  }

  static WifiMqttClient client(makeConfig());
  gClient = &client;

  if (client.connectWifi()) {
    polaris::time::syncFromNtp();
    if (client.connectMqtt()) {
      subscribeCommands(client);
      republishAllSpotStates();
    }
  }

  Serial.println("[actuators] Ready — 2× servo + FC-51 occupancy (spots 1..10)");
  Serial.printf("[actuators] Servo closed=%d open=%d invert=%d boot_grace=%lums\n",
                polaris::hw::kServoClosedAngle,
                polaris::hw::kServoOpenAngle,
#if defined(POLARIS_SERVO_INVERT)
                1,
#else
                0,
#endif
                polaris::hw::kServoBootGraceMs);
  Serial.printf("[actuators] Pins entry=%d exit=%d attached=%d/%d\n",
                gEntryServo.pin(),
                gExitServo.pin(),
                gEntryServo.isAttached() ? 1 : 0,
                gExitServo.isAttached() ? 1 : 0);
}

void loop() {
  const unsigned long nowMs = millis();
  ensureMqtt();

  applyServoCommand(POLARIS_ENTRY_SERVO_ID, gEntryServo, gPendingEntry);
  applyServoCommand(POLARIS_EXIT_SERVO_ID, gExitServo, gPendingExit);

  if (nowMs - gLastZonePollMs >= polaris::hw::kZonePollMs) {
    gLastZonePollMs = nowMs;
    for (auto& spot : gSpots) {
      updateSpot(spot, nowMs);
    }
  }

  delay(5);
}

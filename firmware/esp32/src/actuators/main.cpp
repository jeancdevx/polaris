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

void handleServoCommand(const char* servoId, ServoBarrier& servo, JsonDocument& doc) {
  const char* action = doc["action"] | "";

  if (strcmp(action, "open") == 0) {
    if (millis() - gBootMs < polaris::hw::kServoBootGraceMs) {
      Serial.printf("[actuators] Ignored open for %s during boot grace\n", servoId);
      return;
    }

    const int angle = doc["angle"] | polaris::hw::kServoOpenAngle;
    servo.setAngle(angle);
    publishServoStatus(servoId, "open", "command");
    Serial.printf("[actuators] Servo %s opened (angle=%d)\n", servoId, angle);
    return;
  }

  if (strcmp(action, "close") == 0) {
    const int angle = doc["angle"] | polaris::hw::kServoClosedAngle;
    servo.setAngle(angle);
    publishServoStatus(servoId, "closed", "command");
    Serial.printf("[actuators] Servo %s closed (angle=%d)\n", servoId, angle);
    return;
  }

  Serial.printf("[actuators] Ignored servo command for %s (action=%s)\n", servoId, action);
}

void forceServosClosedOnBoot(const char* reason) {
  gEntryServo.close();
  gExitServo.close();
  publishServoStatus(POLARIS_ENTRY_SERVO_ID, "closed", reason);
  publishServoStatus(POLARIS_EXIT_SERVO_ID, "closed", reason);
  Serial.printf("[actuators] Servos forced closed (%s)\n", reason);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  JsonDocument doc;
  if (deserializeJson(doc, reinterpret_cast<const char*>(payload), length)) {
    return;
  }

  if (strstr(topic, "/servo/") == nullptr) {
    return;
  }

  if (strstr(topic, POLARIS_ENTRY_SERVO_ID) != nullptr) {
    handleServoCommand(POLARIS_ENTRY_SERVO_ID, gEntryServo, doc);
    return;
  }

  if (strstr(topic, POLARIS_EXIT_SERVO_ID) != nullptr) {
    handleServoCommand(POLARIS_EXIT_SERVO_ID, gExitServo, doc);
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
  Serial.printf("[actuators] Servo closed=%d open=%d boot_grace=%lums\n",
                polaris::hw::kServoClosedAngle,
                polaris::hw::kServoOpenAngle,
                polaris::hw::kServoBootGraceMs);
}

void loop() {
  const unsigned long nowMs = millis();
  ensureMqtt();

  if (nowMs - gLastZonePollMs >= polaris::hw::kZonePollMs) {
    gLastZonePollMs = nowMs;
    for (auto& spot : gSpots) {
      updateSpot(spot, nowMs);
    }
  }

  delay(5);
}


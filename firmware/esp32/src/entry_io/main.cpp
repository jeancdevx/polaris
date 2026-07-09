#include <Arduino.h>
#include <ArduinoJson.h>

#include "hardware_config.h"
#include "lcd_display.h"
#include "mqtt_topics.h"
#include "pins_entry_io.h"
#include "polaris_config.h"
#include "polaris_time.h"
#include "rfid_reader.h"
#include "role_info.h"
#include "ultrasonic_sensor.h"
#include "wifi_mqtt.h"

// Este firmware corre en el ESP32 #1:
// - Lee proximidad (HC-SR04) y 2× RFID (RC522 entrada + salida, SPI compartido)
// - Controla LCD I2C
// - Publica comandos de servo hacia el ESP32 actuators (ESP32 #2)

namespace {

WifiMqttClient* gClient = nullptr;
RfidReader gRfidEntry(polaris::pins::entry_io::kRfidEntrySs,
                      polaris::pins::entry_io::kRfidEntryRst);
RfidReader gRfidExit(polaris::pins::entry_io::kRfidExitSs,
                     polaris::pins::entry_io::kRfidExitRst);
UltrasonicSensor gUltrasonic(polaris::pins::entry_io::kUltrasonicTrig,
                             polaris::pins::entry_io::kUltrasonicEcho);
LcdDisplay gLcd(polaris::pins::entry_io::kLcdAddress, 16, 2);

bool gEntryGateOpenAssumed = false;
bool gExitGateOpenAssumed = false;
unsigned long gExitGateOpenedMs = 0;
bool gProximityActive = false;
unsigned long gProximitySinceMs = 0;
unsigned long gLastUltrasonicMs = 0;
unsigned long gClearedSinceMs = 0;
unsigned long gLastSafetyBlockMs = 0;
unsigned long gGateOpenedMs = 0;
unsigned long gLastPassageTelemetryMs = 0;
bool gPassageStalledPublished = false;
int gLastDistanceCm = 999;

bool publishServoCommand(const char* servoId, const char* action, int angle) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return false;
  }

  JsonDocument doc;
  doc["deviceId"] = servoId;
  doc["action"] = action;
  doc["angle"] = angle;
  doc["timestamp"] = polaris::time::nowEpochMs();

  return gClient->publishJson(polaris::mqtt::servoCommandTopic(servoId).c_str(), doc);
}

void closeEntryGateSafe(const char* reason) {
  publishServoCommand(POLARIS_ENTRY_SERVO_ID, "close", polaris::hw::kServoClosedAngle);
  gProximityActive = false;
  gClearedSinceMs = 0;
  gPassageStalledPublished = false;
  gLcd.showIdle();
  Serial.printf("[entry_io] Entry gate close requested (%s)\n", reason);
}

void closeExitGate(const char* reason) {
  publishServoCommand(POLARIS_EXIT_SERVO_ID, "close", polaris::hw::kServoClosedAngle);
  Serial.printf("[entry_io] Exit gate close requested (%s)\n", reason);
}

void publishExitBarrierTimeout() {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "exit_barrier_timeout";
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::kRfidEntryProximityTopic, doc);
}

void handleServoStatus(const char* servoId, JsonDocument& doc) {
  const char* status = doc["status"] | "";
  const bool isOpen = strcmp(status, "open") == 0;

  if (strstr(servoId, POLARIS_ENTRY_SERVO_ID) != nullptr) {
    gEntryGateOpenAssumed = isOpen;
    if (isOpen) {
      gGateOpenedMs = millis();
      gClearedSinceMs = 0;
      gPassageStalledPublished = false;
      Serial.println("[entry_io] Entry gate reported open");
      return;
    }

    gProximityActive = false;
    Serial.println("[entry_io] Entry gate reported closed");
    return;
  }

  if (strstr(servoId, POLARIS_EXIT_SERVO_ID) != nullptr) {
    gExitGateOpenAssumed = isOpen;
    if (isOpen) {
      gExitGateOpenedMs = millis();
      Serial.println("[entry_io] Exit gate reported open");
      return;
    }

    Serial.println("[entry_io] Exit gate reported closed");
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  JsonDocument doc;
  if (deserializeJson(doc, reinterpret_cast<const char*>(payload), length)) {
    return;
  }

  if (strstr(topic, "/servo/") != nullptr && strstr(topic, "/status") != nullptr) {
    const char* servoId = strstr(topic, "/servo/") + 7;
    char servoKey[32];
    snprintf(servoKey, sizeof(servoKey), "%.*s", (int)strcspn(servoId, "/"), servoId);
    handleServoStatus(servoKey, doc);
    return;
  }

  if (strstr(topic, "/display/") != nullptr) {
    const char* line1 = doc["line1"] | "";
    const char* line2 = doc["line2"] | "";
    const bool backlight = doc["backlight"] | true;
    gLcd.showLines(line1, line2, backlight);
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
  client.subscribe(polaris::mqtt::displayCommandTopic(POLARIS_ENTRY_DISPLAY_ID).c_str());
  client.subscribe(polaris::mqtt::servoStatusTopic(POLARIS_ENTRY_SERVO_ID).c_str());
  client.subscribe(polaris::mqtt::servoStatusTopic(POLARIS_EXIT_SERVO_ID).c_str());
}

void publishProximity(int distanceCm) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "proximity_detected";
  doc["distance_cm"] = distanceCm;
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::kRfidEntryProximityTopic, doc);
}

void publishProximityTimeout() {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "proximity_timeout";
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::kRfidEntryProximityTopic, doc);
}

void publishRfidScan(const String& uid, const char* readerLocation) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "rfid_scan";
  doc["rfid_uid"] = uid;
  doc["reader_location"] = readerLocation;
  doc["timestamp"] = polaris::time::nowEpochMs();

  const bool isExit = strcmp(readerLocation, "exit") == 0;
  const char* topic = isExit ? polaris::mqtt::rfidExitTopic(POLARIS_DEVICE_ID).c_str()
                               : polaris::mqtt::rfidEntryTopic(POLARIS_DEVICE_ID).c_str();
  gClient->publishJson(topic, doc);
  Serial.printf("[entry_io] RFID %s published uid=%s\n", readerLocation, uid.c_str());
}

void publishPassageTelemetry(int distanceCm) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "passage_in_progress";
  doc["distance_cm"] = distanceCm;
  doc["gate_state"] = gEntryGateOpenAssumed ? "open" : "closed";
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::kRfidEntryProximityTopic, doc);
}

void publishPassageStalled() {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "passage_stalled";
  doc["distance_cm"] = gLastDistanceCm;
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::kRfidEntryProximityTopic, doc);
}

void handleUltrasonic(unsigned long nowMs) {
  if (nowMs - gLastUltrasonicMs < polaris::hw::kUltrasonicPollMs) {
    return;
  }
  gLastUltrasonicMs = nowMs;

  const int distance = gUltrasonic.measureCm();
  gLastDistanceCm = distance;

  if (distance < polaris::hw::kSafetyBlockCm) {
    gLastSafetyBlockMs = nowMs;
  }

  if (!gEntryGateOpenAssumed && distance < polaris::hw::kApproachCm) {
    if (!gProximityActive) {
      gProximityActive = true;
      gProximitySinceMs = nowMs;
      publishProximity(distance);
      gLcd.showProximityPrompt();
      Serial.printf("[entry_io] Proximity detected %d cm\n", distance);
    }
  }

  if (gProximityActive && !gEntryGateOpenAssumed &&
      (nowMs - gProximitySinceMs) >= polaris::hw::kProximityTimeoutMs) {
    publishProximityTimeout();
    gProximityActive = false;
    gLcd.showIdle();
    Serial.println("[entry_io] Proximity timeout");
  }

  if (!gEntryGateOpenAssumed) {
    return;
  }

  if (nowMs - gLastPassageTelemetryMs >= polaris::hw::kPassageTelemetryMs) {
    gLastPassageTelemetryMs = nowMs;
    publishPassageTelemetry(distance);
  }

  if (!gPassageStalledPublished && distance < polaris::hw::kApproachCm &&
      (nowMs - gGateOpenedMs) >= polaris::hw::kBarrierMaxOpenMs) {
    gPassageStalledPublished = true;
    publishPassageStalled();
    Serial.println("[entry_io] Passage stalled alert");
  }

  if (distance > polaris::hw::kClearedCm) {
    if (gClearedSinceMs == 0) {
      gClearedSinceMs = nowMs;
    }
  } else {
    gClearedSinceMs = 0;
  }

  if (gClearedSinceMs == 0) {
    return;
  }

  const bool clearedLongEnough = (nowMs - gClearedSinceMs) >= polaris::hw::kClearedHoldMs;
  const bool safetyClear = (nowMs - gLastSafetyBlockMs) >= polaris::hw::kClearedHoldMs;

  if (clearedLongEnough && safetyClear) {
    closeEntryGateSafe("ultrasonic_cleared");
  }
}

void handleExitGate(unsigned long nowMs) {
  if (!gExitGateOpenAssumed) {
    return;
  }

  const unsigned long openMs = nowMs - gExitGateOpenedMs;

  if (openMs >= polaris::hw::kExitMaxOpenMs) {
    publishExitBarrierTimeout();
    closeExitGate("exit_max_open_timeout");
    return;
  }

  if (openMs >= polaris::hw::kExitCloseAfterMs &&
      openMs >= polaris::hw::kExitMinOpenMs) {
    closeExitGate("exit_passage_heuristic");
  }
}

void handleEntryRfid() {
  String uid;
  if (!gRfidEntry.readUid(uid)) {
    return;
  }

  gProximityActive = false;
  publishRfidScan(uid, "entry");
}

void handleExitRfid() {
  String uid;
  if (!gRfidExit.readUid(uid)) {
    return;
  }

  publishRfidScan(uid, "exit");
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
      }
    }
  }
  gClient->loop();
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.printf("\nPolaris ESP32 — role=%s deviceId=%s\n", kRoleName, POLARIS_DEVICE_ID);

  gRfidEntry.begin(polaris::pins::entry_io::kRfidSck,
                   polaris::pins::entry_io::kRfidMiso,
                   polaris::pins::entry_io::kRfidMosi);
  gRfidExit.begin(polaris::pins::entry_io::kRfidSck,
                  polaris::pins::entry_io::kRfidMiso,
                  polaris::pins::entry_io::kRfidMosi);
  gUltrasonic.begin();
  gLcd.begin(polaris::pins::entry_io::kLcdSda, polaris::pins::entry_io::kLcdScl);

  static WifiMqttClient client(makeConfig());
  gClient = &client;

  if (client.connectWifi()) {
    polaris::time::syncFromNtp();
    if (client.connectMqtt()) {
      subscribeCommands(client);
    }
  }

  Serial.println("[entry_io] Ready — 2× RC522 + LCD I2C + HC-SR04 (servo via MQTT)");
}

void loop() {
  const unsigned long nowMs = millis();
  ensureMqtt();
  handleUltrasonic(nowMs);
  handleEntryRfid();
  handleExitRfid();
  handleExitGate(nowMs);
  delay(5);
}


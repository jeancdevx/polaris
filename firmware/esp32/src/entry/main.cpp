#include <Arduino.h>
#include <ArduinoJson.h>

#include "hardware_config.h"
#include "lcd_display.h"
#include "mqtt_topics.h"
#include "pins_entry.h"
#include "polaris_config.h"
#include "polaris_time.h"
#include "rfid_reader.h"
#include "role_info.h"
#include "servo_barrier.h"
#include "ultrasonic_sensor.h"
#include "wifi_mqtt.h"

namespace {

WifiMqttClient* gClient = nullptr;
RfidReader gRfid(polaris::pins::entry::kRfidSs, polaris::pins::entry::kRfidRst);
UltrasonicSensor gUltrasonic(polaris::pins::entry::kUltrasonicTrig,
                             polaris::pins::entry::kUltrasonicEcho);
ServoBarrier gServo(polaris::pins::entry::kServo);
LcdDisplay gLcd(polaris::pins::entry::kLcdAddress, 16, 2);

bool gBarrierOpen = false;
bool gProximityActive = false;
unsigned long gProximitySinceMs = 0;
unsigned long gLastUltrasonicMs = 0;
unsigned long gClearedSinceMs = 0;
unsigned long gLastSafetyBlockMs = 0;
unsigned long gBarrierOpenedMs = 0;
unsigned long gLastPassageTelemetryMs = 0;
bool gPassageStalledPublished = false;
int gLastDistanceCm = 999;

void publishServoStatus(const char* status, const char* reason) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_ENTRY_SERVO_ID;
  doc["status"] = status;
  doc["close_reason"] = reason;
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::servoStatusTopic(POLARIS_ENTRY_SERVO_ID).c_str(), doc);
}

void closeBarrierSafe(const char* reason) {
  gServo.close();
  gBarrierOpen = false;
  gProximityActive = false;
  gClearedSinceMs = 0;
  gPassageStalledPublished = false;
  gLcd.showIdle();
  publishServoStatus("closed", reason);
  Serial.printf("[entry] Barrier closed (%s)\n", reason);
}

void openBarrier() {
  gServo.open();
  gBarrierOpen = true;
  gBarrierOpenedMs = millis();
  gClearedSinceMs = 0;
  gPassageStalledPublished = false;
  Serial.println("[entry] Barrier opened");
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  JsonDocument doc;
  if (deserializeJson(doc, reinterpret_cast<const char*>(payload), length)) {
    return;
  }

  if (strstr(topic, "/servo/") != nullptr) {
    const char* action = doc["action"] | "";
    const int angle = doc["angle"] | polaris::hw::kServoOpenAngle;
    if (strcmp(action, "open") == 0 || angle >= polaris::hw::kServoOpenAngle) {
      openBarrier();
    } else {
      closeBarrierSafe("remote_command");
    }
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
  client.subscribe(polaris::mqtt::servoCommandTopic(POLARIS_ENTRY_SERVO_ID).c_str());
  client.subscribe(polaris::mqtt::displayCommandTopic(POLARIS_ENTRY_DISPLAY_ID).c_str());
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

void publishRfidScan(const String& uid) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "rfid_scan";
  doc["rfid_uid"] = uid;
  doc["reader_location"] = "entry";
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::rfidEntryTopic(POLARIS_DEVICE_ID).c_str(), doc);
  Serial.printf("[entry] RFID published uid=%s\n", uid.c_str());
}

void publishPassageTelemetry(int distanceCm) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "passage_in_progress";
  doc["distance_cm"] = distanceCm;
  doc["barrier_state"] = "open";
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

  if (!gBarrierOpen && distance < polaris::hw::kApproachCm) {
    if (!gProximityActive) {
      gProximityActive = true;
      gProximitySinceMs = nowMs;
      publishProximity(distance);
      gLcd.showProximityPrompt();
      Serial.printf("[entry] Proximity detected %d cm\n", distance);
    }
  }

  if (gProximityActive && !gBarrierOpen &&
      (nowMs - gProximitySinceMs) >= polaris::hw::kProximityTimeoutMs) {
    publishProximityTimeout();
    gProximityActive = false;
    gLcd.showIdle();
    Serial.println("[entry] Proximity timeout");
  }

  if (!gBarrierOpen) {
    return;
  }

  if (nowMs - gLastPassageTelemetryMs >= polaris::hw::kPassageTelemetryMs) {
    gLastPassageTelemetryMs = nowMs;
    publishPassageTelemetry(distance);
  }

  if (!gPassageStalledPublished && distance < polaris::hw::kApproachCm &&
      (nowMs - gBarrierOpenedMs) >= polaris::hw::kBarrierMaxOpenMs) {
    gPassageStalledPublished = true;
    publishPassageStalled();
    Serial.println("[entry] Passage stalled alert");
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

  const bool clearedLongEnough =
      (nowMs - gClearedSinceMs) >= polaris::hw::kClearedHoldMs;
  const bool safetyClear =
      (nowMs - gLastSafetyBlockMs) >= polaris::hw::kClearedHoldMs;

  if (clearedLongEnough && safetyClear) {
    closeBarrierSafe("ultrasonic_cleared");
  }
}

void handleRfid() {
  String uid;
  if (!gRfid.readUid(uid)) {
    return;
  }

  gProximityActive = false;
  publishRfidScan(uid);
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

  gRfid.begin();
  gUltrasonic.begin();
  gServo.begin();
  gLcd.begin(polaris::pins::entry::kLcdSda, polaris::pins::entry::kLcdScl);

  static WifiMqttClient client(makeConfig());
  gClient = &client;

  if (client.connectWifi()) {
    polaris::time::syncFromNtp();
    if (client.connectMqtt()) {
      subscribeCommands(client);
    }
  }

  Serial.println("[entry] Ready — HC-SR04 + RC522 + servo + LCD");
}

void loop() {
  ensureMqtt();
  handleUltrasonic(millis());
  handleRfid();
  delay(5);
}

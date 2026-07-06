#include <Arduino.h>
#include <ArduinoJson.h>

#include "hardware_config.h"
#include "mqtt_topics.h"
#include "pins_exit.h"
#include "polaris_config.h"
#include "polaris_time.h"
#include "rfid_reader.h"
#include "role_info.h"
#include "servo_barrier.h"
#include "wifi_mqtt.h"

namespace {

WifiMqttClient* gClient = nullptr;
RfidReader gRfid(polaris::pins::exit::kRfidSs, polaris::pins::exit::kRfidRst);
ServoBarrier gServo(polaris::pins::exit::kServo);

bool gBarrierOpen = false;
unsigned long gBarrierOpenedMs = 0;
unsigned long gLastRfidMs = 0;

void publishServoStatus(const char* status, const char* reason) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_EXIT_SERVO_ID;
  doc["status"] = status;
  doc["close_reason"] = reason;
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::servoStatusTopic(POLARIS_EXIT_SERVO_ID).c_str(), doc);
}

void openBarrier() {
  gServo.open();
  gBarrierOpen = true;
  gBarrierOpenedMs = millis();
  gLastRfidMs = millis();
  Serial.println("[exit] Barrier opened");
}

void closeBarrier(const char* reason) {
  gServo.close();
  gBarrierOpen = false;
  publishServoStatus("closed", reason);
  Serial.printf("[exit] Barrier closed (%s)\n", reason);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  JsonDocument doc;
  if (deserializeJson(doc, reinterpret_cast<const char*>(payload), length)) {
    return;
  }

  if (strstr(topic, "/servo/") == nullptr) {
    return;
  }

  const char* action = doc["action"] | "";
  const int angle = doc["angle"] | polaris::hw::kServoOpenAngle;
  if (strcmp(action, "open") == 0 || angle >= polaris::hw::kServoOpenAngle) {
    openBarrier();
  } else {
    closeBarrier("remote_command");
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
  client.subscribe(polaris::mqtt::servoCommandTopic(POLARIS_EXIT_SERVO_ID).c_str());
}

void publishRfidScan(const String& uid) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "rfid_scan";
  doc["rfid_uid"] = uid;
  doc["reader_location"] = "exit";
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::rfidExitTopic(POLARIS_DEVICE_ID).c_str(), doc);
  gLastRfidMs = millis();
  Serial.printf("[exit] RFID published uid=%s\n", uid.c_str());
}

void handleBarrierHeuristic(unsigned long nowMs) {
  if (!gBarrierOpen) {
    return;
  }

  if ((nowMs - gBarrierOpenedMs) >= polaris::hw::kExitMaxOpenMs) {
    closeBarrier("exit_barrier_timeout");
    return;
  }

  if ((nowMs - gBarrierOpenedMs) < polaris::hw::kExitMinOpenMs) {
    return;
  }

  if ((nowMs - gLastRfidMs) >= polaris::hw::kExitCloseAfterMs) {
    closeBarrier("exit_passage_heuristic");
  }
}

void handleRfid() {
  String uid;
  if (!gRfid.readUid(uid)) {
    return;
  }
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
  gServo.begin();

  static WifiMqttClient client(makeConfig());
  gClient = &client;

  if (client.connectWifi()) {
    polaris::time::syncFromNtp();
    if (client.connectMqtt()) {
      subscribeCommands(client);
    }
  }

  Serial.println("[exit] Ready — RC522 + servo");
}

void loop() {
  const unsigned long nowMs = millis();
  ensureMqtt();
  handleRfid();
  handleBarrierHeuristic(nowMs);
  delay(5);
}

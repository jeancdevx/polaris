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
bool gExitPassageArmed = false;
unsigned long gExitGateOpenedMs = 0;
bool gProximityActive = false;
bool gVehiclePresent = false;
bool gEntryRfidConsumed = false;
unsigned long gProximitySinceMs = 0;
unsigned long gProximityGoneSinceMs = 0;
unsigned long gLastUltrasonicMs = 0;
unsigned long gClearedSinceMs = 0;
unsigned long gLastSafetyBlockMs = 0;
unsigned long gGateOpenedMs = 0;
unsigned long gLastPassageTelemetryMs = 0;
bool gPassageStalledPublished = false;
int gLastDistanceCm = 999;
int gLastGoodDistanceCm = 999;
unsigned long gLastGoodApproachMs = 0;
int gProximityClearReads = 0;

bool isDistanceUnknown(int distanceCm) {
  return distanceCm <= 0 || distanceCm >= 900;
}

bool isWithinApproach(int distanceCm) {
  return !isDistanceUnknown(distanceCm) &&
         distanceCm <= polaris::hw::kApproachCm;
}

bool isWithinApproachRelease(int distanceCm) {
  return !isDistanceUnknown(distanceCm) &&
         distanceCm <= polaris::hw::kApproachReleaseCm;
}

bool hasRecentEntryPresence(unsigned long nowMs) {
  return gLastGoodApproachMs > 0 &&
         (nowMs - gLastGoodApproachMs) <= polaris::hw::kVehiclePresentGraceMs;
}

bool isEntryPresenceLatched(unsigned long nowMs) {
  return gVehiclePresent || gProximityActive || hasRecentEntryPresence(nowMs);
}

void resetEntryPresenceCycle(const char* reason) {
  const bool hadState =
      gProximityActive || gVehiclePresent || gEntryRfidConsumed;
  gProximityActive = false;
  gVehiclePresent = false;
  gEntryRfidConsumed = false;
  gProximitySinceMs = 0;
  gProximityGoneSinceMs = 0;
  gLastGoodApproachMs = 0;
  gProximityClearReads = 0;
  if (hadState) {
    Serial.printf("[entry_io] Entry presence cycle reset (%s)\n", reason);
  }
}

void noteGoodApproach(unsigned long nowMs, int distanceCm) {
  gLastGoodApproachMs = nowMs;
  gLastGoodDistanceCm = distanceCm;
  gLastDistanceCm = distanceCm;
  gProximityGoneSinceMs = 0;
  gProximityClearReads = 0;
}

bool publishServoCommand(const char* servoId, const char* action) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return false;
  }

  JsonDocument doc;
  doc["deviceId"] = servoId;
  doc["action"] = action;
  doc["timestamp"] = polaris::time::nowEpochMs();

  return gClient->publishJson(polaris::mqtt::servoCommandTopic(servoId).c_str(), doc);
}

void closeEntryGateSafe(const char* reason) {
  publishServoCommand(POLARIS_ENTRY_SERVO_ID, "close");
  gClearedSinceMs = 0;
  gPassageStalledPublished = false;
  gLcd.showIdle();
  Serial.printf("[entry_io] Entry gate close requested (%s)\n", reason);
}

void closeExitGate(const char* reason) {
  gExitPassageArmed = false;
  gExitGateOpenAssumed = false;
  gExitGateOpenedMs = 0;
  publishServoCommand(POLARIS_EXIT_SERVO_ID, "close");
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
      gProximityActive = false;
      Serial.println("[entry_io] Entry gate reported open");
      return;
    }

    // Barrera cerrada: si el vehículo ya no está, libera pasada.
    // Si sigue delante del HC, mantiene consumed hasta que se aleje.
    gProximityActive = false;
    const bool vehicleStillThere =
        isEntryPresenceLatched(millis()) ||
        isWithinApproachRelease(gLastGoodDistanceCm);
    if (!vehicleStillThere) {
      resetEntryPresenceCycle("entry_gate_closed");
      gLcd.showIdle();
    } else {
      gVehiclePresent = true;
      gEntryRfidConsumed = true;
      Serial.println(
          "[entry_io] Entry gate closed — RFID still locked until vehicle leaves");
    }
    Serial.println("[entry_io] Entry gate reported closed");
    return;
  }

  if (strstr(servoId, POLARIS_EXIT_SERVO_ID) != nullptr) {
    if (isOpen) {
      if (!gExitPassageArmed) {
        Serial.println("[entry_io] Exit gate open ignored (no RFID passage armed)");
        return;
      }

      gExitGateOpenedMs = millis();
      gExitGateOpenAssumed = true;
      Serial.println("[entry_io] Exit gate reported open (passage armed)");
      return;
    }

    gExitGateOpenAssumed = false;
    gExitPassageArmed = false;
    gExitGateOpenedMs = 0;
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
    if (doc["freeSpots"].is<int>()) {
      gLcd.setFreeSpots(doc["freeSpots"].as<int>());
    }

    const bool idle = doc["idle"] | false;
    if (idle) {
      gLcd.showIdle();
      return;
    }

    const char* line1 = doc["line1"] | "";
    const char* line2 = doc["line2"] | "";
    const bool backlight = doc["backlight"] | true;
    if (line1[0] != '\0' || line2[0] != '\0') {
      gLcd.showLines(line1, line2, backlight);
    } else {
      gLcd.showIdle();
    }
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

  unsigned long echoMicros = 0;
  const int distance = gUltrasonic.measureCm(&echoMicros);
  const bool distanceUnknown = isDistanceUnknown(distance);
  if (!distanceUnknown) {
    gLastDistanceCm = distance;
  }

#if defined(POLARIS_DEBUG_ULTRASONIC)
  static unsigned long lastDebugMs = 0;
  if (nowMs - lastDebugMs >= 5000) {
    lastDebugMs = nowMs;
    Serial.printf(
        "[entry_io] Ultrasonic TRIG=%d ECHO=%d echo_us=%lu distance=%d cm%s\n",
        polaris::pins::entry_io::kUltrasonicTrig,
        polaris::pins::entry_io::kUltrasonicEcho,
        echoMicros,
        distance,
        echoMicros == 0 ? " (timeout — sin pulso ECHO)" : "");
  }
#endif

  if (!distanceUnknown && distance < polaris::hw::kSafetyBlockCm) {
    gLastSafetyBlockMs = nowMs;
  }

  if (!gEntryGateOpenAssumed) {
    const bool inArmWindow = isWithinApproach(distance);
    const bool stillHolding = isWithinApproachRelease(distance);

    if (inArmWindow) {
      noteGoodApproach(nowMs, distance);
      if (!gVehiclePresent) {
        gVehiclePresent = true;
        Serial.printf("[entry_io] Vehicle present %d cm\n", distance);
      }

      // Solo arma RFID al entrar en la ventana 0..kApproachCm.
      if (!gEntryRfidConsumed && !gProximityActive) {
        gProximityActive = true;
        publishProximity(distance);
        gLcd.showProximityPrompt();
        Serial.printf("[entry_io] Proximity detected %d cm (RFID armed)\n", distance);
      }
      gProximitySinceMs = nowMs;
    } else if (stillHolding && gVehiclePresent) {
      // Histeresis: 13–40 cm no desarma (el log real oscila 8↔13).
      noteGoodApproach(nowMs, distance);
      gProximitySinceMs = nowMs;
    } else if (distanceUnknown && isEntryPresenceLatched(nowMs)) {
      // Timeout 999 / sin eco: NO desarma. Mantiene gracia reciente.
      gProximityClearReads = 0;
      gProximityGoneSinceMs = 0;
    } else if (!distanceUnknown && isEntryPresenceLatched(nowMs)) {
      // Distancia clara fuera de histeresis: exige N lecturas + hold.
      ++gProximityClearReads;
      if (gProximityGoneSinceMs == 0) {
        gProximityGoneSinceMs = nowMs;
      }
      if (gProximityClearReads >= polaris::hw::kProximityClearConfirmReads &&
          (nowMs - gProximityGoneSinceMs) >= polaris::hw::kProximityClearHoldMs) {
        resetEntryPresenceCycle("vehicle_left");
        gLcd.showIdle();
        Serial.printf("[entry_io] Proximity cleared %d cm\n", distance);
      }
    }

    return;
  }

  if (nowMs - gLastPassageTelemetryMs >= polaris::hw::kPassageTelemetryMs) {
    gLastPassageTelemetryMs = nowMs;
    publishPassageTelemetry(distanceUnknown ? gLastDistanceCm : distance);
  }

  if (!gPassageStalledPublished && !distanceUnknown &&
      distance < polaris::hw::kApproachCm &&
      (nowMs - gGateOpenedMs) >= polaris::hw::kBarrierMaxOpenMs) {
    gPassageStalledPublished = true;
    publishPassageStalled();
    Serial.println("[entry_io] Passage stalled alert");
  }

  const int passageDistance = distanceUnknown ? gLastDistanceCm : distance;
  if (!isDistanceUnknown(passageDistance) &&
      passageDistance > polaris::hw::kClearedCm) {
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
  if (!gExitPassageArmed || !gExitGateOpenAssumed || gExitGateOpenedMs == 0) {
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

bool tryConsumeEntryRfid(const String& uid, const char* via) {
  const unsigned long nowMs = millis();

  if (gEntryGateOpenAssumed) {
    Serial.printf(
        "[entry_io] Entry RFID ignored — gate already open (%s) uid=%s\n",
        via,
        uid.c_str());
    return false;
  }

  if (gEntryRfidConsumed) {
    Serial.printf(
        "[entry_io] Entry RFID ignored — already used this passage (%s) uid=%s\n",
        via,
        uid.c_str());
    return false;
  }

  if (!isEntryPresenceLatched(nowMs)) {
    Serial.printf(
        "[entry_io] Entry RFID ignored — vehiculo debe estar a <=%dcm "
        "(ahora=%dcm good=%dcm present=%d armed=%d grace=%d) via=%s uid=%s\n",
        polaris::hw::kApproachCm,
        gLastDistanceCm,
        gLastGoodDistanceCm,
        gVehiclePresent ? 1 : 0,
        gProximityActive ? 1 : 0,
        hasRecentEntryPresence(nowMs) ? 1 : 0,
        via,
        uid.c_str());
    gLcd.showProximityPrompt();
    return false;
  }

  gEntryRfidConsumed = true;
  gProximityActive = false;
  publishRfidScan(uid, "entry");
  Serial.printf(
      "[entry_io] Entry RFID consumed via=%s uid=%s dist=%dcm good=%dcm\n",
      via,
      uid.c_str(),
      gLastDistanceCm,
      gLastGoodDistanceCm);
  return true;
}

void handleEntryRfid() {
  String uid;
  if (!gRfidEntry.readUid(uid)) {
    return;
  }
  tryConsumeEntryRfid(uid, "entry_reader");
}

void handleExitRfid() {
  String uid;
  if (!gRfidExit.readUid(uid)) {
    return;
  }

  const unsigned long nowMs = millis();
  // Con presencia de entrada armada, el RC522 de salida a menudo captura la
  // misma tarjeta (antenas cerca / bus SPI). Tratarla como lectura de entrada.
  if (isEntryPresenceLatched(nowMs) && !gEntryRfidConsumed) {
    Serial.printf(
        "[entry_io] Exit reader saw card during entry presence — routing to entry uid=%s\n",
        uid.c_str());
    tryConsumeEntryRfid(uid, "exit_reader_routed");
    return;
  }

  if (gExitPassageArmed && gExitGateOpenAssumed) {
    Serial.printf(
        "[entry_io] Exit RFID ignored — passage in progress uid=%s\n",
        uid.c_str());
    return;
  }

  gExitPassageArmed = true;
  gExitGateOpenAssumed = false;
  gExitGateOpenedMs = 0;

  Serial.printf("[entry_io] RFID exit detected uid=%s\n", uid.c_str());
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
  delay(100);
  gRfidExit.begin(polaris::pins::entry_io::kRfidSck,
                  polaris::pins::entry_io::kRfidMiso,
                  polaris::pins::entry_io::kRfidMosi);
  // Segundo RC522 deja el bus SPI inestable; reinit del de entrada.
  delay(50);
  gRfidEntry.begin(polaris::pins::entry_io::kRfidSck,
                   polaris::pins::entry_io::kRfidMiso,
                   polaris::pins::entry_io::kRfidMosi);
  digitalWrite(polaris::pins::entry_io::kRfidEntrySs, HIGH);
  digitalWrite(polaris::pins::entry_io::kRfidExitSs, HIGH);
  gUltrasonic.begin();
  gLcd.begin(polaris::pins::entry_io::kLcdSda, polaris::pins::entry_io::kLcdScl);

  Serial.printf("[entry_io] RFID entry reader: %s (SS=%d RST=%d)\n",
                gRfidEntry.isHealthy() ? "OK" : "FALLO",
                polaris::pins::entry_io::kRfidEntrySs,
                polaris::pins::entry_io::kRfidEntryRst);
  Serial.printf("[entry_io] RFID exit reader: %s (SS=%d RST=%d)\n",
                gRfidExit.isHealthy() ? "OK" : "FALLO — revise cableado",
                polaris::pins::entry_io::kRfidExitSs,
                polaris::pins::entry_io::kRfidExitRst);
  Serial.printf(
      "[entry_io] RFID arm <=%dcm, hold <=%dcm, clear %dx/%lums, grace %lums\n",
      polaris::hw::kApproachCm,
      polaris::hw::kApproachReleaseCm,
      polaris::hw::kProximityClearConfirmReads,
      polaris::hw::kProximityClearHoldMs,
      polaris::hw::kVehiclePresentGraceMs);

  static WifiMqttClient client(makeConfig());
  gClient = &client;

  if (client.connectWifi()) {
    polaris::time::syncFromNtp();
    if (client.connectMqtt()) {
      subscribeCommands(client);
    }
  }

  Serial.printf(
      "[entry_io] HC-SR04 TRIG=GPIO%d ECHO=GPIO%d (VCC=5V, GND común, divisor "
      "ECHO→3.3V)\n",
      polaris::pins::entry_io::kUltrasonicTrig,
      polaris::pins::entry_io::kUltrasonicEcho);
  Serial.println("[entry_io] Ready — 2× RC522 + LCD I2C + HC-SR04 (servo via MQTT)");
}

void loop() {
  const unsigned long nowMs = millis();
  ensureMqtt();
  handleUltrasonic(nowMs);
  // Entrada primero: critica para peaje; antenas mutuas en readUid.
  handleEntryRfid();
  handleExitRfid();
  handleExitGate(nowMs);
  delay(5);
}


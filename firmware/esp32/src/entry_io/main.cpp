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
uint32_t gCommandBootNonce = 0;
uint32_t gCommandSequence = 0;

struct PendingCloseCommand {
  bool active = false;
  char commandId[96] = {};
  unsigned long lastPublishMs = 0;
  unsigned int attempts = 0;
};

PendingCloseCommand gPendingEntryClose;
PendingCloseCommand gPendingExitClose;
constexpr unsigned long kCloseRetryMs = 2'000;
unsigned long gCloudLcdUntilMs = 0;
bool gCloudLcdActive = false;
constexpr unsigned long kCloudLcdHoldMs = 8'000;

bool shouldPreserveCloudLcd(unsigned long nowMs) {
  if (!gCloudLcdActive) {
    return false;
  }
  if (nowMs >= gCloudLcdUntilMs) {
    gCloudLcdActive = false;
    return false;
  }
  return true;
}

void showLocalLcd(void (*showFn)()) {
  if (!shouldPreserveCloudLcd(millis())) {
    showFn();
  }
}

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

bool publishServoCommandWithId(const char* servoId,
                               const char* action,
                               const char* commandId,
                               bool force = false) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return false;
  }

  JsonDocument doc;
  doc["deviceId"] = servoId;
  doc["action"] = action;
  doc["commandId"] = commandId;
  doc["timestamp"] = polaris::time::nowEpochMs();
  if (force) {
    doc["force"] = true;
  }

  const bool published =
      gClient->publishJson(polaris::mqtt::servoCommandTopic(servoId).c_str(), doc);
  Serial.printf("[entry_io] Servo command %s action=%s id=%s force=%d publish=%s\n",
                servoId,
                action,
                commandId,
                force ? 1 : 0,
                published ? "ok" : "failed");
  return published;
}

PendingCloseCommand& pendingCloseFor(const char* servoId) {
  return strcmp(servoId, POLARIS_ENTRY_SERVO_ID) == 0
             ? gPendingEntryClose
             : gPendingExitClose;
}

bool requestServoClose(const char* servoId) {
  PendingCloseCommand& pending = pendingCloseFor(servoId);
  const bool isRetry = pending.active;

  if (!pending.active) {
    pending.active = true;
    pending.attempts = 0;
  }

  snprintf(pending.commandId,
           sizeof(pending.commandId),
           "%s:%08lx:%lu",
           POLARIS_DEVICE_ID,
           static_cast<unsigned long>(gCommandBootNonce),
           static_cast<unsigned long>(++gCommandSequence));

  pending.lastPublishMs = millis();
  pending.attempts++;
  return publishServoCommandWithId(
      servoId, "close", pending.commandId, isRetry && pending.attempts > 1);
}

void servicePendingClose(const char* servoId,
                         PendingCloseCommand& pending,
                         unsigned long nowMs) {
  if (!pending.active || nowMs - pending.lastPublishMs < kCloseRetryMs) {
    return;
  }
  requestServoClose(servoId);
}

void closeEntryGateSafe(const char* reason) {
  requestServoClose(POLARIS_ENTRY_SERVO_ID);
  gClearedSinceMs = 0;
  gPassageStalledPublished = false;
  if (isEntryPresenceLatched(millis())) {
    showLocalLcd([]() { gLcd.showPassageInProgress(); });
  } else {
    showLocalLcd([]() { gLcd.showIdle(); });
  }
  Serial.printf("[entry_io] Entry gate close requested (%s)\n", reason);
}

void closeExitGate(const char* reason) {
  gExitPassageArmed = false;
  gExitGateOpenAssumed = false;
  gExitGateOpenedMs = 0;
  requestServoClose(POLARIS_EXIT_SERVO_ID);
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
  const char* result = doc["result"] | "legacy";
  const char* action = doc["action"] | "unknown";
  const char* commandId = doc["commandId"] | "legacy-missing";
  const int angle = doc["angle"] | -1;
  Serial.printf(
      "[entry_io] Servo ack %s result=%s status=%s action=%s angle=%d id=%s\n",
      servoId,
      result,
      status,
      action,
      angle,
      commandId);

  PendingCloseCommand& pendingClose = pendingCloseFor(servoId);
  if (pendingClose.active && strcmp(action, "close") == 0 &&
      strcmp(status, "closed") == 0 &&
      (strcmp(result, "applied") == 0 || strcmp(result, "duplicate") == 0) &&
      strcmp(commandId, pendingClose.commandId) == 0) {
    Serial.printf(
        "[entry_io] Correlated close acknowledged servo=%s id=%s attempts=%u\n",
        servoId,
        commandId,
        pendingClose.attempts);
    pendingClose.active = false;
  }

  if (strcmp(result, "rejected") == 0 || strcmp(status, "unknown") == 0) {
    return;
  }
  if (strcmp(status, "open") != 0 && strcmp(status, "closed") != 0) {
    return;
  }
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
      showLocalLcd([]() { gLcd.showIdle(); });
    } else {
      gVehiclePresent = true;
      gEntryRfidConsumed = true;
      showLocalLcd([]() { gLcd.showPassageInProgress(); });
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
      gCloudLcdActive = true;
      gCloudLcdUntilMs = millis() + kCloudLcdHoldMs;
      gLcd.showLines(line1, line2, backlight);
    } else if (!idle) {
      showLocalLcd([]() { gLcd.showIdle(); });
    }
  }
}

WifiMqttConfig makeConfig() {
  return WifiMqttConfig{
      .wifiSsid = POLARIS_WIFI_SSID,
      .wifiPassword = POLARIS_WIFI_PASSWORD,
      .iotEndpoint = POLARIS_IOT_ENDPOINT,
      .thingName = POLARIS_IOT_THING_NAME,
      .deviceId = POLARIS_DEVICE_ID,
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
        showLocalLcd([]() { gLcd.showVehicleDetected(); });
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
        showLocalLcd([]() { gLcd.showIdle(); });
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
  const bool openLongEnough =
      gGateOpenedMs > 0 &&
      (nowMs - gGateOpenedMs) >= polaris::hw::kEntryMinOpenBeforeClearMs;
  const bool safetyClear =
      gLastSafetyBlockMs == 0 ||
      (nowMs - gLastSafetyBlockMs) >= polaris::hw::kSafetyClearAfterBlockMs;

  if (clearedLongEnough && openLongEnough && safetyClear) {
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
  showLocalLcd([]() { gLcd.showValidating(); });
  Serial.printf(
      "[entry_io] Entry RFID consumed via=%s uid=%s dist=%dcm good=%dcm\n",
      via,
      uid.c_str(),
      gLastDistanceCm,
      gLastGoodDistanceCm);
  return true;
}

void handleEntryRfid() {
  // While exit passage is open, ignore entry reader noise.
  if (gExitPassageArmed && gExitGateOpenAssumed) {
    return;
  }
  String uid;
  if (!gRfidEntry.readUid(uid)) {
    return;
  }
  tryConsumeEntryRfid(uid, "entry_reader");
}

void handleExitRfid() {
  const unsigned long nowMs = millis();

  // Do not even poll the exit RC522 while entry presence is locked — SPI
  // thrashing here freezes entry_io and floods serial.
  if (gEntryRfidConsumed && isEntryPresenceLatched(nowMs)) {
    return;
  }
  if (gEntryGateOpenAssumed) {
    return;
  }

  String uid;
  if (!gRfidExit.readUid(uid)) {
    return;
  }

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
  gCommandBootNonce = esp_random();

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
  ensureMqtt();
  const unsigned long nowMs = millis();
  servicePendingClose(
      POLARIS_ENTRY_SERVO_ID, gPendingEntryClose, nowMs);
  servicePendingClose(POLARIS_EXIT_SERVO_ID, gPendingExitClose, nowMs);
  handleUltrasonic(nowMs);
  // Entrada primero: critica para peaje; antenas mutuas en readUid.
  handleEntryRfid();
  handleExitRfid();
  handleExitGate(nowMs);
  delay(5);
}


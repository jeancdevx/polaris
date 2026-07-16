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
  char commandId[96] = {};
  bool hasCommandId = false;
  bool forceRewrite = false;
  int angle = -1;  // <0 → use hardware default for action
};

PendingServoCommand gPendingEntry;
PendingServoCommand gPendingExit;

constexpr size_t kRecentCommandCount = 16;
char gRecentCommandIds[kRecentCommandCount][96] = {};
size_t gRecentCommandNext = 0;

String spotIdFromNumber(int spotNumber) {
  char buffer[12];
  snprintf(buffer, sizeof(buffer), "spot-%02d", spotNumber);
  return String(buffer);
}

void publishServoStatus(const char* servoId,
                        const char* status,
                        const char* result,
                        const char* reason,
                        const char* action,
                        int angle,
                        const char* commandId,
                        bool legacy) {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = servoId;
  doc["status"] = status;
  doc["result"] = result;
  doc["close_reason"] = reason;
  doc["action"] = action;
  doc["angle"] = angle;
  if (commandId != nullptr && commandId[0] != '\0') {
    doc["commandId"] = commandId;
  }
  doc["commandIdSource"] = legacy ? "legacy-missing" : "provided";
  doc["timestamp"] = polaris::time::nowEpochMs();
  gClient->publishJson(polaris::mqtt::servoStatusTopic(servoId).c_str(), doc);
}

bool hasSeenCommandId(const char* commandId) {
  if (commandId == nullptr || commandId[0] == '\0') {
    return false;
  }
  for (const auto& recent : gRecentCommandIds) {
    if (strcmp(recent, commandId) == 0) {
      return true;
    }
  }
  return false;
}

void rememberCommandId(const char* commandId) {
  if (commandId == nullptr || commandId[0] == '\0') {
    return;
  }
  strncpy(gRecentCommandIds[gRecentCommandNext],
          commandId,
          sizeof(gRecentCommandIds[gRecentCommandNext]) - 1);
  gRecentCommandIds[gRecentCommandNext]
                   [sizeof(gRecentCommandIds[gRecentCommandNext]) - 1] = '\0';
  gRecentCommandNext = (gRecentCommandNext + 1) % kRecentCommandCount;
}

const char* servoState(const ServoBarrier& servo) {
  if (servo.angle() < 0) {
    return "unknown";
  }
  return servo.isOpen() ? "open" : "closed";
}

void queueServoCommand(PendingServoCommand& slot,
                       const char* action,
                       int angle,
                       const char* commandId,
                       bool forceRewrite = false) {
  slot.pending = true;
  strncpy(slot.action, action, sizeof(slot.action) - 1);
  slot.action[sizeof(slot.action) - 1] = '\0';
  slot.hasCommandId = commandId != nullptr && commandId[0] != '\0';
  slot.forceRewrite = forceRewrite;
  if (slot.hasCommandId) {
    strncpy(slot.commandId, commandId, sizeof(slot.commandId) - 1);
    slot.commandId[sizeof(slot.commandId) - 1] = '\0';
  } else {
    slot.commandId[0] = '\0';
  }
  slot.angle = angle;
}

void applyServoCommand(const char* servoId, ServoBarrier& servo, PendingServoCommand& slot) {
  if (!slot.pending) {
    return;
  }
  slot.pending = false;

  if (strcmp(slot.action, "open") == 0) {
    if (millis() - gBootMs < polaris::hw::kServoBootGraceMs) {
      publishServoStatus(servoId,
                         servoState(servo),
                         "rejected",
                         "boot_grace",
                         slot.action,
                         slot.angle,
                         slot.commandId,
                         !slot.hasCommandId);
      Serial.printf("[actuators] Rejected open for %s during boot grace id=%s\n",
                    servoId,
                    slot.hasCommandId ? slot.commandId : "legacy-missing");
      return;
    }

    const int angle =
        slot.angle >= 0 ? slot.angle : polaris::hw::kServoOpenAngle;
    if (!servo.setAngle(angle, slot.forceRewrite)) {
      publishServoStatus(servoId,
                         servoState(servo),
                         "rejected",
                         "pwm_not_attached",
                         slot.action,
                         angle,
                         slot.commandId,
                         !slot.hasCommandId);
      Serial.printf("[actuators] Servo %s OPEN failed (PWM not attached)\n", servoId);
      return;
    }
    if (slot.hasCommandId) {
      rememberCommandId(slot.commandId);
    }
    publishServoStatus(servoId,
                       "open",
                       "applied",
                       "command",
                       slot.action,
                       angle,
                       slot.commandId,
                       !slot.hasCommandId);
    Serial.printf("[actuators] Servo %s opened (angle=%d pin=%d)\n",
                  servoId,
                  angle,
                  servo.pin());
    return;
  }

  if (strcmp(slot.action, "close") == 0) {
    const int angle =
        slot.angle >= 0 ? slot.angle : polaris::hw::kServoClosedAngle;
    if (!servo.setAngle(angle, slot.forceRewrite)) {
      publishServoStatus(servoId,
                         servoState(servo),
                         "rejected",
                         "pwm_not_attached",
                         slot.action,
                         angle,
                         slot.commandId,
                         !slot.hasCommandId);
      Serial.printf("[actuators] Servo %s CLOSE failed (PWM not attached)\n", servoId);
      return;
    }
    if (slot.hasCommandId) {
      rememberCommandId(slot.commandId);
    }
    publishServoStatus(servoId,
                       "closed",
                       "applied",
                       "command",
                       slot.action,
                       angle,
                       slot.commandId,
                       !slot.hasCommandId);
    Serial.printf("[actuators] Servo %s closed (angle=%d pin=%d)\n",
                  servoId,
                  angle,
                  servo.pin());
    return;
  }

}

#if defined(POLARIS_SERVO_SELF_TEST)
// Movimiento visible para verificar cableado/alimentación sin MQTT.
void runServoSelfTest() {
  Serial.println("[actuators] Servo self-test: open then close both...");
  gEntryServo.setAngle(polaris::hw::kServoOpenAngle);
  gExitServo.setAngle(polaris::hw::kServoOpenAngle);
  delay(900);
  gEntryServo.setAngle(polaris::hw::kServoClosedAngle);
  gExitServo.setAngle(polaris::hw::kServoClosedAngle);
  delay(400);
  Serial.println("[actuators] Servo self-test done (si no se movieron: 5V/GND/señal)");
}
#endif

void publishServoReady(const char* reason) {
  Serial.printf(
      "[actuators] Servo control ready state=unknown reason=%s entry_pin=%d exit_pin=%d\n",
      reason,
      gEntryServo.pin(),
      gExitServo.pin());
  publishServoStatus(POLARIS_ENTRY_SERVO_ID,
                     "unknown",
                     "ready",
                     reason,
                     "none",
                     -1,
                     nullptr,
                     true);
  publishServoStatus(POLARIS_EXIT_SERVO_ID,
                     "unknown",
                     "ready",
                     reason,
                     "none",
                     -1,
                     nullptr,
                     true);
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
  const bool hasAngle = doc["angle"].is<int>();
  const int angle = hasAngle ? doc["angle"].as<int>() : -1;
  const char* commandId = doc["commandId"] | "";

  const char* servoId = nullptr;
  PendingServoCommand* pending = nullptr;
  ServoBarrier* servo = nullptr;

  if (strstr(topic, "/" POLARIS_ENTRY_SERVO_ID) != nullptr ||
      strcmp(topic + strlen(topic) - strlen(POLARIS_ENTRY_SERVO_ID),
             POLARIS_ENTRY_SERVO_ID) == 0) {
    servoId = POLARIS_ENTRY_SERVO_ID;
    pending = &gPendingEntry;
    servo = &gEntryServo;
  } else if (strstr(topic, "/" POLARIS_EXIT_SERVO_ID) != nullptr ||
             strcmp(topic + strlen(topic) - strlen(POLARIS_EXIT_SERVO_ID),
                    POLARIS_EXIT_SERVO_ID) == 0) {
    servoId = POLARIS_EXIT_SERVO_ID;
    pending = &gPendingExit;
    servo = &gExitServo;
  } else {
    return;
  }

  const bool legacy = commandId[0] == '\0';
  const bool force = doc["force"] | false;
  if (!legacy && !force && hasSeenCommandId(commandId)) {
    publishServoStatus(servoId,
                       servoState(*servo),
                       "duplicate",
                       "command_id_seen",
                       action,
                       angle,
                       commandId,
                       false);
    Serial.printf("[actuators] Duplicate command ignored servo=%s id=%s\n",
                  servoId,
                  commandId);
    return;
  }

  const bool validAction =
      strcmp(action, "open") == 0 || strcmp(action, "close") == 0;
  const bool validAngle = !hasAngle || (angle >= 0 && angle <= 180);
  const bool validCommandId =
      legacy || strlen(commandId) < sizeof(gRecentCommandIds[0]);
  if (!validAction || !validAngle || !validCommandId) {
    const char* reason = !validAction
                             ? "invalid_action"
                             : (!validAngle ? "angle_out_of_range"
                                            : "command_id_too_long");
    publishServoStatus(servoId,
                       servoState(*servo),
                       "rejected",
                       reason,
                       action,
                       angle,
                       commandId,
                       legacy);
    Serial.printf(
        "[actuators] Rejected command servo=%s action=%s angle=%d id=%s reason=%s\n",
        servoId,
        action,
        angle,
        legacy ? "legacy-missing" : commandId,
        reason);
    return;
  }

  if (pending->pending) {
    publishServoStatus(servoId,
                       servoState(*servo),
                       "rejected",
                       "command_queue_busy",
                       action,
                       angle,
                       commandId,
                       legacy);
    Serial.printf("[actuators] Rejected command servo=%s id=%s reason=queue_busy\n",
                  servoId,
                  legacy ? "legacy-missing" : commandId);
    return;
  }

  Serial.printf("[actuators] Cmd queued %s action=%s angle=%d id=%s\n",
                servoId,
                action,
                angle,
                legacy ? "legacy-missing" : commandId);
  queueServoCommand(*pending, action, angle, commandId, force);
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
      // Re-attach tras reconexión WiFi (LEDC puede quedar inválido).
      gEntryServo.begin();
      gExitServo.begin();
      gEntryServo.reassertLastCommand();
      gExitServo.reassertLastCommand();
      if (gClient->connectMqtt()) {
        subscribeCommands(*gClient);
        publishServoReady("mqtt_reconnect");
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

  for (auto& spot : gSpots) {
    spot.sensor.begin();
  }

  static WifiMqttClient client(makeConfig());
  gClient = &client;

  // WiFi/LEDC: adjuntar servos DESPUÉS de WiFi o el PWM queda mudo.
  const bool wifiOk = client.connectWifi();
  if (wifiOk) {
    polaris::time::syncFromNtp();
  }

  gEntryServo.begin();
  gExitServo.begin();
#if defined(POLARIS_SERVO_SELF_TEST)
  runServoSelfTest();
#endif

  if (wifiOk && client.connectMqtt()) {
    subscribeCommands(client);
    publishServoReady("boot_attach");
    republishAllSpotStates();
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
  Serial.println(
      "[actuators] Wiring: SG90 VCC=5V externo, GND común ESP, señal entry=GPIO13 exit=GPIO22");
#if !defined(POLARIS_SERVO_SELF_TEST)
  Serial.println("[actuators] Boot servo movement disabled (POLARIS_SERVO_SELF_TEST not set)");
#endif
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

#include <Arduino.h>
#include <ArduinoJson.h>

#include "hardware_config.h"
#include "mqtt_topics.h"
#include "pins_zone.h"
#include "polaris_config.h"
#include "polaris_time.h"
#include "role_info.h"
#include "wifi_mqtt.h"
#include "zone_spot.h"

#ifndef POLARIS_SPOT_FIRST
#error "POLARIS_SPOT_FIRST required for zone builds"
#endif

#ifndef POLARIS_SPOT_LAST
#error "POLARIS_SPOT_LAST required for zone builds"
#endif

static_assert(polaris::pins::zone::kSpotCount ==
                  (POLARIS_SPOT_LAST - POLARIS_SPOT_FIRST + 1),
              "Zone spot count must match pins_zone.h and platformio.ini");

namespace {

WifiMqttClient* gClient = nullptr;
ZoneSpot* gSpots[polaris::pins::zone::kSpotCount] = {};
unsigned long gLastZonePollMs = 0;

String spotIdFromNumber(int spotNumber) {
  char buffer[12];
  snprintf(buffer, sizeof(buffer), "spot-%02d", spotNumber);
  return String(buffer);
}

RgbMode modeFromString(const char* mode) {
  if (strcmp(mode, "occupied") == 0) {
    return RgbMode::Occupied;
  }
  if (strcmp(mode, "blink_green") == 0 || strcmp(mode, "reserved") == 0) {
    return RgbMode::BlinkGreen;
  }
  return RgbMode::Free;
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
  Serial.printf("[zone] Occupancy %s -> %s\n", spotId.c_str(), occupied ? "occupied" : "free");
  return ok;
}

ZoneSpot* findSpotByNumber(int spotNumber) {
  for (int i = 0; i < polaris::pins::zone::kSpotCount; ++i) {
    if (gSpots[i] != nullptr && gSpots[i]->spotNumber() == spotNumber) {
      return gSpots[i];
    }
  }
  return nullptr;
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  JsonDocument doc;
  if (deserializeJson(doc, reinterpret_cast<const char*>(payload), length)) {
    return;
  }

  if (strstr(topic, "/led/") == nullptr) {
    return;
  }

  const char* mode = doc["mode"] | "free";
  const char* spot = doc["spotId"] | "";
  if (spot[0] == '\0') {
    return;
  }

  int spotNumber = 0;
  if (sscanf(spot, "spot-%d", &spotNumber) != 1) {
    return;
  }

  if (ZoneSpot* zoneSpot = findSpotByNumber(spotNumber)) {
    zoneSpot->setLedMode(modeFromString(mode));
    Serial.printf("[zone] LED command %s -> %s\n", spot, mode);
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

void subscribeLedCommands(WifiMqttClient& client) {
  for (int spot = POLARIS_SPOT_FIRST; spot <= POLARIS_SPOT_LAST; ++spot) {
    client.subscribe(polaris::mqtt::ledCommandTopic(spotIdFromNumber(spot).c_str()).c_str());
  }
}

void ensureMqtt() {
  if (gClient == nullptr) {
    return;
  }

  if (!gClient->isMqttConnected()) {
    if (gClient->connectWifi()) {
      polaris::time::syncFromNtp();
      if (gClient->connectMqtt()) {
        subscribeLedCommands(*gClient);
      }
    }
  }
  gClient->loop();
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.printf(
      "\nPolaris ESP32 — role=%s deviceId=%s spots=%d..%d (%d sensores)\n",
      kRoleName,
      POLARIS_DEVICE_ID,
      POLARIS_SPOT_FIRST,
      POLARIS_SPOT_LAST,
      polaris::pins::zone::kSpotCount);

  static ZoneSpot spots[] = {
      ZoneSpot(POLARIS_SPOT_FIRST + 0,
               polaris::pins::zone::kFc51[0],
               polaris::pins::zone::kRgb[0].r,
               polaris::pins::zone::kRgb[0].g,
               polaris::pins::zone::kRgb[0].b),
      ZoneSpot(POLARIS_SPOT_FIRST + 1,
               polaris::pins::zone::kFc51[1],
               polaris::pins::zone::kRgb[1].r,
               polaris::pins::zone::kRgb[1].g,
               polaris::pins::zone::kRgb[1].b),
      ZoneSpot(POLARIS_SPOT_FIRST + 2,
               polaris::pins::zone::kFc51[2],
               polaris::pins::zone::kRgb[2].r,
               polaris::pins::zone::kRgb[2].g,
               polaris::pins::zone::kRgb[2].b),
      ZoneSpot(POLARIS_SPOT_FIRST + 3,
               polaris::pins::zone::kFc51[3],
               polaris::pins::zone::kRgb[3].r,
               polaris::pins::zone::kRgb[3].g,
               polaris::pins::zone::kRgb[3].b),
  };

  for (int i = 0; i < polaris::pins::zone::kSpotCount; ++i) {
    gSpots[i] = &spots[i];
    gSpots[i]->begin();
  }

  static WifiMqttClient client(makeConfig());
  gClient = &client;

  if (client.connectWifi()) {
    polaris::time::syncFromNtp();
    if (client.connectMqtt()) {
      subscribeLedCommands(client);
    }
  }

  Serial.println("[zone] Ready — 4× FC-51 + 4× RGB");
}

void loop() {
  const unsigned long nowMs = millis();
  ensureMqtt();

  if (nowMs - gLastZonePollMs >= polaris::hw::kZonePollMs) {
    gLastZonePollMs = nowMs;
    for (int i = 0; i < polaris::pins::zone::kSpotCount; ++i) {
      gSpots[i]->update(nowMs, publishOccupancy);
    }
  }

  delay(5);
}

#include <Arduino.h>
#include <ArduinoJson.h>

#include "hardware_config.h"
#include "mqtt_topics.h"
#include "pins_leds.h"
#include "polaris_config.h"
#include "polaris_time.h"
#include "rgb_led.h"
#include "role_info.h"
#include "wifi_mqtt.h"

#ifndef POLARIS_SPOT_FIRST
#error "POLARIS_SPOT_FIRST required for leds builds"
#endif

#ifndef POLARIS_SPOT_LAST
#error "POLARIS_SPOT_LAST required for leds builds"
#endif

static_assert(polaris::pins::leds::kSpotCount ==
                  (POLARIS_SPOT_LAST - POLARIS_SPOT_FIRST + 1),
              "LED spot count must match pins_leds.h and platformio.ini");

namespace {

WifiMqttClient* gClient = nullptr;
RgbLed* gLeds[polaris::pins::leds::kSpotCount] = {};
unsigned long gLastBlinkTick = 0;
unsigned long gLastSyncRequestMs = 0;
bool gCloudStateReceived = false;

constexpr unsigned long kSyncRetryMs = 30'000;

String spotIdFromNumber(int spotNumber) {
  char buffer[12];
  snprintf(buffer, sizeof(buffer), "spot-%02d", spotNumber);
  return String(buffer);
}

RgbMode modeFromString(const char* mode) {
  if (strcmp(mode, "occupied") == 0) {
    return RgbMode::Occupied;
  }
  if (strcmp(mode, "blink_blue") == 0 || strcmp(mode, "blink_green") == 0 ||
      strcmp(mode, "reserved") == 0) {
    return RgbMode::BlinkBlue;
  }
  if (strcmp(mode, "off") == 0) {
    return RgbMode::Off;
  }
  return RgbMode::Free;
}

RgbLed* findLedBySpotNumber(int spotNumber) {
  if (spotNumber < POLARIS_SPOT_FIRST || spotNumber > POLARIS_SPOT_LAST) {
    return nullptr;
  }
  return gLeds[spotNumber - POLARIS_SPOT_FIRST];
}

const char* spotIdFromTopic(const char* topic) {
  const char* ledPrefix = strstr(topic, "/led/");
  if (ledPrefix == nullptr) {
    return "";
  }
  return ledPrefix + 5;
}

bool applyLedCommand(const char* spot, const char* mode) {
  int spotNumber = 0;
  if (sscanf(spot, "spot-%d", &spotNumber) != 1) {
    Serial.printf("[leds] ignore bad spotId=%s\n", spot);
    return false;
  }

  RgbLed* led = findLedBySpotNumber(spotNumber);
  if (led == nullptr) {
    Serial.printf(
        "[leds] spot %d out of range for this device (%d..%d)\n",
        spotNumber,
        POLARIS_SPOT_FIRST,
        POLARIS_SPOT_LAST);
    return false;
  }

  led->setMode(modeFromString(mode));
  gCloudStateReceived = true;
  Serial.printf("[leds] cloud %s -> %s\n", spot, mode);
  return true;
}

void publishLedSyncRequest() {
  if (gClient == nullptr || !gClient->isMqttConnected()) {
    return;
  }

  JsonDocument doc;
  doc["deviceId"] = POLARIS_DEVICE_ID;
  doc["event"] = "led_sync_request";
  doc["spotFirst"] = POLARIS_SPOT_FIRST;
  doc["spotLast"] = POLARIS_SPOT_LAST;
  doc["timestamp"] = polaris::time::nowEpochMs();

  if (gClient->publishJson(polaris::mqtt::kLedSyncRequestTopic, doc)) {
    gLastSyncRequestMs = millis();
    Serial.printf(
        "[leds] cloud sync requested spots %d..%d\n",
        POLARIS_SPOT_FIRST,
        POLARIS_SPOT_LAST);
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  if (strstr(topic, "/led/") == nullptr) {
    return;
  }

  char json[512];
  if (length >= sizeof(json)) {
    Serial.printf("[leds] payload too large topic=%s len=%u\n", topic, length);
    return;
  }
  memcpy(json, payload, length);
  json[length] = '\0';

  Serial.printf("[leds] mqtt in topic=%s payload=%s\n", topic, json);

  JsonDocument doc;
  if (deserializeJson(doc, json)) {
    Serial.printf("[leds] cloud JSON parse failed topic=%s\n", topic);
    return;
  }

  const char* mode = doc["mode"] | "free";
  const char* spot = doc["spotId"] | "";
  if (spot[0] == '\0') {
    spot = spotIdFromTopic(topic);
  }
  if (spot[0] == '\0') {
    Serial.printf("[leds] missing spotId topic=%s\n", topic);
    return;
  }

  applyLedCommand(spot, mode);
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

  const unsigned long drainUntil = millis() + 1500;
  while (millis() < drainUntil) {
    client.loop();
    delay(10);
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
        publishLedSyncRequest();
      }
    }
    return;
  }

  gClient->loop();

  if (!gCloudStateReceived &&
      millis() - gLastSyncRequestMs >= kSyncRetryMs) {
    publishLedSyncRequest();
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.printf(
      "\nPolaris ESP32 — role=%s deviceId=%s leds=%d..%d (%d)\n",
      kRoleName,
      POLARIS_DEVICE_ID,
      POLARIS_SPOT_FIRST,
      POLARIS_SPOT_LAST,
      polaris::pins::leds::kSpotCount);

  static RgbLed leds[] = {
      RgbLed(polaris::pins::leds::kRgb[0].r,
             polaris::pins::leds::kRgb[0].g,
             polaris::pins::leds::kRgb[0].b),
      RgbLed(polaris::pins::leds::kRgb[1].r,
             polaris::pins::leds::kRgb[1].g,
             polaris::pins::leds::kRgb[1].b),
      RgbLed(polaris::pins::leds::kRgb[2].r,
             polaris::pins::leds::kRgb[2].g,
             polaris::pins::leds::kRgb[2].b),
      RgbLed(polaris::pins::leds::kRgb[3].r,
             polaris::pins::leds::kRgb[3].g,
             polaris::pins::leds::kRgb[3].b),
      RgbLed(polaris::pins::leds::kRgb[4].r,
             polaris::pins::leds::kRgb[4].g,
             polaris::pins::leds::kRgb[4].b),
  };

  for (int i = 0; i < polaris::pins::leds::kSpotCount; ++i) {
    gLeds[i] = &leds[i];
    gLeds[i]->begin();
  }

  static WifiMqttClient client(makeConfig());
  gClient = &client;

  if (client.connectWifi()) {
    polaris::time::syncFromNtp();
    if (client.connectMqtt()) {
      subscribeLedCommands(client);
      publishLedSyncRequest();
    }
  }

  Serial.println("[leds] Ready — cloud LED commands via parking/commands/led/*");
}

void loop() {
  const unsigned long nowMs = millis();
  ensureMqtt();

  if (nowMs - gLastBlinkTick >= 25) {
    gLastBlinkTick = nowMs;
    for (int i = 0; i < polaris::pins::leds::kSpotCount; ++i) {
      gLeds[i]->update(nowMs);
    }
  }

  delay(5);
}

#include "wifi_mqtt.h"

#include <WiFi.h>
#include <cstring>

#include <ArduinoJson.h>

namespace {

const char* trimPem(const char* pem) {
  if (pem == nullptr) {
    return "";
  }
  while (*pem == ' ' || *pem == '\t' || *pem == '\r' || *pem == '\n') {
    ++pem;
  }
  return pem;
}

bool pemLooksValid(const char* pem, const char* label) {
  pem = trimPem(pem);
  if (strncmp(pem, "-----BEGIN ", 11) != 0) {
    Serial.printf("[mqtt] Invalid %s PEM: must start with -----BEGIN\n", label);
    return false;
  }
  if (strstr(pem, "-----END ") == nullptr) {
    Serial.printf("[mqtt] Invalid %s PEM: missing -----END\n", label);
    return false;
  }
  Serial.printf("[mqtt] %s PEM bytes=%u\n", label,
                static_cast<unsigned int>(strlen(pem)));
  return true;
}

}  // namespace

WifiMqttClient* WifiMqttClient::active_ = nullptr;

WifiMqttClient::WifiMqttClient(const WifiMqttConfig& config)
    : config_(config), mqtt_(network_) {
  active_ = this;
  mqtt_.setCallback(WifiMqttClient::routeMqttMessage);
}

void WifiMqttClient::routeMqttMessage(char* topic, byte* payload, unsigned int length) {
  if (active_ != nullptr && active_->config_.onMessage != nullptr) {
    active_->config_.onMessage(topic, payload, length);
  }
}

bool WifiMqttClient::connectWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  Serial.printf("[wifi] Connecting to %s\n", config_.wifiSsid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(config_.wifiSsid, config_.wifiPassword);

  const unsigned long deadline = millis() + 30'000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) {
    delay(250);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[wifi] Connection failed");
    return false;
  }

  Serial.printf("[wifi] Connected, IP=%s\n", WiFi.localIP().toString().c_str());
  return true;
}

bool WifiMqttClient::connectMqtt() {
  const char* deviceCert = trimPem(config_.deviceCertPem);
  const char* deviceKey = trimPem(config_.deviceKeyPem);
  const char* rootCa = trimPem(config_.rootCaPem);

  if (strlen(deviceCert) == 0 || strlen(deviceKey) == 0) {
    Serial.println("[mqtt] Skipping TLS connect — no device cert in config (compile-check mode)");
    return false;
  }

  const String thingName(config_.thingName);
  if (strlen(config_.deviceId) == 0 || !thingName.endsWith(config_.deviceId)) {
    Serial.printf(
        "[mqtt] Refusing TLS connect — Thing %s does not match firmware device %s\n",
        config_.thingName,
        config_.deviceId);
    return false;
  }

  if (!pemLooksValid(deviceCert, "device cert") ||
      !pemLooksValid(deviceKey, "device key") ||
      !pemLooksValid(rootCa, "root CA")) {
    return false;
  }

  network_.setCACert(rootCa);
  network_.setCertificate(deviceCert);
  network_.setPrivateKey(deviceKey);

  mqtt_.setServer(config_.iotEndpoint, 8883);
  mqtt_.setBufferSize(4096);
  mqtt_.setKeepAlive(30);

  Serial.printf("[mqtt] Connecting to %s as %s\n", config_.iotEndpoint, config_.thingName);

  const unsigned long deadline = millis() + 30'000;
  while (!mqtt_.connected() && millis() < deadline) {
    if (mqtt_.connect(config_.thingName)) {
      Serial.println("[mqtt] Connected");
      return true;
    }

    Serial.printf("[mqtt] Retry in 3s (state=%d)\n", mqtt_.state());
    delay(3000);
  }

  Serial.println("[mqtt] Connection failed");
  return false;
}

bool WifiMqttClient::isMqttConnected() { return mqtt_.connected(); }

void WifiMqttClient::loop() {
  if (mqtt_.connected()) {
    mqtt_.loop();
  }
}

bool WifiMqttClient::publish(const char* topic, const char* payload, bool retained) {
  if (!mqtt_.connected()) {
    return false;
  }

  const bool ok = mqtt_.publish(topic, payload, retained);
  if (!ok) {
    Serial.printf("[mqtt] Publish failed topic=%s\n", topic);
  }
  return ok;
}

bool WifiMqttClient::publishJson(const char* topic, const JsonDocument& doc, bool retained) {
  char buffer[512];
  const size_t required = measureJson(doc);
  if (required >= sizeof(buffer)) {
    Serial.printf("[mqtt] JSON too large topic=%s bytes=%u limit=%u\n",
                  topic,
                  static_cast<unsigned int>(required),
                  static_cast<unsigned int>(sizeof(buffer) - 1));
    return false;
  }
  const size_t length = serializeJson(doc, buffer, sizeof(buffer));
  if (length == 0) {
    return false;
  }
  return publish(topic, buffer, retained);
}

bool WifiMqttClient::subscribe(const char* topic) {
  if (!mqtt_.connected()) {
    return false;
  }

  const bool ok = mqtt_.subscribe(topic, 1);
  Serial.printf("[mqtt] Subscribe %s -> %s\n", topic, ok ? "ok" : "fail");
  // Drain retained/queued messages between subscriptions.
  mqtt_.loop();
  return ok;
}

WiFiClientSecure& WifiMqttClient::networkClient() { return network_; }

PubSubClient& WifiMqttClient::mqttClient() { return mqtt_; }

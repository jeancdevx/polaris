#pragma once

#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

using MqttMessageHandler = void (*)(char* topic, byte* payload, unsigned int length);

struct WifiMqttConfig {
  const char* wifiSsid;
  const char* wifiPassword;
  const char* iotEndpoint;
  const char* thingName;
  const char* deviceCertPem;
  const char* deviceKeyPem;
  const char* rootCaPem;
  MqttMessageHandler onMessage;
};

class WifiMqttClient {
 public:
  explicit WifiMqttClient(const WifiMqttConfig& config);

  bool connectWifi();
  bool connectMqtt();
  bool isMqttConnected();
  void loop();
  bool publish(const char* topic, const char* payload, bool retained = false);
  bool publishJson(const char* topic, const JsonDocument& doc, bool retained = false);
  bool subscribe(const char* topic);

  WiFiClientSecure& networkClient();
  PubSubClient& mqttClient();

 private:
  WifiMqttConfig config_;
  WiFiClientSecure network_;
  PubSubClient mqtt_;

  static void routeMqttMessage(char* topic, byte* payload, unsigned int length);
  static WifiMqttClient* active_;
};

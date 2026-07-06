#pragma once

#include <Arduino.h>

class UltrasonicSensor {
 public:
  UltrasonicSensor(int trigPin, int echoPin);

  void begin();
  int measureCm();

 private:
  int trigPin_;
  int echoPin_;
};

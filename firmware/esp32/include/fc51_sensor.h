#pragma once

#include <Arduino.h>

class Fc51Sensor {
 public:
  explicit Fc51Sensor(int pin);

  void begin();
  bool readObstacle() const;

 private:
  int pin_;
};

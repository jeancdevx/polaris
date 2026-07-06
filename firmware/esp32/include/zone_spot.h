#pragma once

#include <Arduino.h>

#include "fc51_sensor.h"
#include "rgb_led.h"

class ZoneSpot {
 public:
  ZoneSpot(int spotNumber, int fc51Pin, int rPin, int gPin, int bPin);

  void begin();
  void update(unsigned long nowMs, bool (*publishOccupancy)(int spotNumber, bool occupied));

  void setLedMode(RgbMode mode);
  int spotNumber() const;

 private:
  int spotNumber_;
  Fc51Sensor sensor_;
  RgbLed led_;

  bool confirmedOccupied_ = false;
  bool pendingOccupied_ = false;
  unsigned long pendingSinceMs_ = 0;
  bool debouncing_ = false;
};

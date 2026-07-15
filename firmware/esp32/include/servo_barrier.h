#pragma once

#include <Arduino.h>
#include <ESP32Servo.h>

class ServoBarrier {
 public:
  explicit ServoBarrier(int pin);

  void begin();
  bool open();
  bool close();
  bool setAngle(int angle);
  bool isOpen() const;
  bool isAttached() const;
  int angle() const;
  int pin() const;

 private:
  int pin_;
  int angle_ = 0;
  bool attached_ = false;
  Servo servo_;
};

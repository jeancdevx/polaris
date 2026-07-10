#pragma once

#include <Arduino.h>
#include <ESP32Servo.h>

class ServoBarrier {
 public:
  explicit ServoBarrier(int pin);

  void begin();
  void open();
  void close();
  void setAngle(int angle);
  bool isOpen() const;
  int angle() const;

 private:
  int pin_;
  int angle_ = 0;
  bool attached_ = false;
  Servo servo_;
};

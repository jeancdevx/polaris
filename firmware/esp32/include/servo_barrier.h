#pragma once

#include <Arduino.h>
#include <ESP32Servo.h>

class ServoBarrier {
 public:
  explicit ServoBarrier(int pin);

  void begin();
  void detach();
  bool open();
  bool close();
  bool setAngle(int angle, bool forceRewrite = false);
  void reassertLastCommand();
  bool isOpen() const;
  bool isAttached() const;
  int angle() const;
  int pin() const;

 private:
  int pin_;
  int angle_ = -1;
  bool attached_ = false;
  Servo servo_;
};

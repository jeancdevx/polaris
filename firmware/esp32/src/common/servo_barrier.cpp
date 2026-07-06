#include "servo_barrier.h"

#include <ESP32Servo.h>

#include "hardware_config.h"

namespace {
Servo gServo;
}

ServoBarrier::ServoBarrier(int pin) : pin_(pin) {}

void ServoBarrier::begin() {
  if (!attached_) {
    gServo.setPeriodHertz(50);
    gServo.attach(pin_, 500, 2400);
    attached_ = true;
  }
  close();
}

void ServoBarrier::open() { setAngle(polaris::hw::kServoOpenAngle); }

void ServoBarrier::close() { setAngle(polaris::hw::kServoClosedAngle); }

void ServoBarrier::setAngle(int angle) {
  if (!attached_) {
    begin();
  }
  angle_ = angle;
  gServo.write(angle_);
}

bool ServoBarrier::isOpen() const {
  return angle_ >= polaris::hw::kServoOpenAngle - 5;
}

int ServoBarrier::angle() const { return angle_; }

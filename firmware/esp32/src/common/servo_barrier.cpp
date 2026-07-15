#include "servo_barrier.h"

#include "hardware_config.h"

namespace {

bool gTimersAllocated = false;

void ensurePwmTimers() {
  if (gTimersAllocated) {
    return;
  }
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  gTimersAllocated = true;
}

}  // namespace

ServoBarrier::ServoBarrier(int pin) : pin_(pin) {}

void ServoBarrier::begin() {
  if (attached_) {
    return;
  }

  ensurePwmTimers();
  servo_.setPeriodHertz(50);

  // SG90: 500–2400 µs pulse range maps write(0)..write(180).
  // attach() may return 0 on failure OR as a valid LEDC channel — trust attached().
  const int channel = servo_.attach(pin_, 500, 2400);
  if (!servo_.attached()) {
    attached_ = false;
    Serial.printf("[servo] attach FAILED pin=%d (channel=%d)\n", pin_, channel);
    return;
  }

  attached_ = true;
  Serial.printf("[servo] attached pin=%d channel=%d\n", pin_, channel);
  close();
}

bool ServoBarrier::open() { return setAngle(polaris::hw::kServoOpenAngle); }

bool ServoBarrier::close() { return setAngle(polaris::hw::kServoClosedAngle); }

bool ServoBarrier::setAngle(int angle) {
  if (!attached_) {
    begin();
  }
  if (!attached_) {
    Serial.printf("[servo] write skipped pin=%d (not attached) angle=%d\n", pin_, angle);
    return false;
  }

  if (angle < 0) {
    angle = 0;
  } else if (angle > 180) {
    angle = 180;
  }

  angle_ = angle;
  servo_.write(angle_);
  Serial.printf("[servo] write pin=%d angle=%d\n", pin_, angle_);
  return true;
}

bool ServoBarrier::isOpen() const {
  const int open = polaris::hw::kServoOpenAngle;
  const int closed = polaris::hw::kServoClosedAngle;
  if (open >= closed) {
    return angle_ >= open - 5;
  }
  // Inverted mounting (open=0, closed=90): open when near 0°.
  return angle_ <= open + 5;
}

bool ServoBarrier::isAttached() const { return attached_; }

int ServoBarrier::angle() const { return angle_; }

int ServoBarrier::pin() const { return pin_; }

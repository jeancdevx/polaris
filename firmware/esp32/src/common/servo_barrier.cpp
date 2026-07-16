#include "servo_barrier.h"

#include "hardware_config.h"

namespace {

bool gTimersAllocated = false;

constexpr int kPulseUsMin = 500;
constexpr int kPulseUsMax = 2400;

int angleToUs(int angle) {
  if (angle < 0) {
    angle = 0;
  } else if (angle > 180) {
    angle = 180;
  }
  return kPulseUsMin +
         ((kPulseUsMax - kPulseUsMin) * angle) / 180;
}

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

void ServoBarrier::detach() {
  if (attached_) {
    servo_.detach();
    attached_ = false;
  }
}

void ServoBarrier::begin() {
  ensurePwmTimers();

  const int previousAngle = angle_;

  // WiFi/LEDC en ESP32 puede invalidar un attach previo: siempre re-attach.
  // attach() alone must never infer or command a physical barrier position.
  if (attached_) {
    servo_.detach();
    attached_ = false;
    delay(20);
  }

  servo_.setPeriodHertz(50);
  const int channel = servo_.attach(pin_, kPulseUsMin, kPulseUsMax);
  if (!servo_.attached()) {
    attached_ = false;
    angle_ = -1;
    Serial.printf("[servo] attach FAILED pin=%d (channel=%d)\n", pin_, channel);
    return;
  }

  attached_ = true;
  Serial.printf("[servo] attached pin=%d channel=%d\n", pin_, channel);

  // Restore holding torque after WiFi/LEDC reattach without a fake motion.
  if (previousAngle >= 0) {
    angle_ = previousAngle;
    servo_.writeMicroseconds(angleToUs(angle_));
    Serial.printf("[servo] hold pin=%d angle=%d\n", pin_, angle_);
  } else {
    angle_ = -1;
  }
}

bool ServoBarrier::open() { return setAngle(polaris::hw::kServoOpenAngle); }

bool ServoBarrier::close() { return setAngle(polaris::hw::kServoClosedAngle); }

bool ServoBarrier::setAngle(int angle, bool forceRewrite) {
  if (angle < 0 || angle > 180) {
    Serial.printf("[servo] write rejected pin=%d angle=%d (valid=0..180)\n",
                  pin_,
                  angle);
    return false;
  }

  if (!attached_) {
    begin();
  }
  if (!attached_) {
    Serial.printf("[servo] write skipped pin=%d (not attached) angle=%d\n", pin_, angle);
    return false;
  }

  // Only re-attach when forced; never nudge through intermediate angles —
  // that caused both SG90s to twitch on a shared 5 V supply.
  if (forceRewrite) {
    servo_.detach();
    attached_ = false;
    delay(15);
    begin();
    if (!attached_) {
      return false;
    }
  }

  angle_ = angle;
  const int us = angleToUs(angle_);
  servo_.writeMicroseconds(us);
  Serial.printf("[servo] write pin=%d angle=%d us=%d%s\n",
                pin_,
                angle_,
                us,
                forceRewrite ? " force" : "");
  return true;
}

void ServoBarrier::reassertLastCommand() {
  if (!attached_ || angle_ < 0) {
    return;
  }

  const int us = angleToUs(angle_);
  servo_.writeMicroseconds(us);
  Serial.printf("[servo] reassert pin=%d angle=%d us=%d\n", pin_, angle_, us);
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

bool ServoBarrier::isAttached() const {
  // ESP32Servo::attached() no es const.
  return attached_;
}

int ServoBarrier::angle() const { return angle_; }

int ServoBarrier::pin() const { return pin_; }

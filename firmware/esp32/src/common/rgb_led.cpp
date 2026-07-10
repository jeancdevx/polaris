#include "rgb_led.h"

#include "hardware_config.h"

RgbLed::RgbLed(int rPin, int gPin, int bPin) : rPin_(rPin), gPin_(gPin), bPin_(bPin) {}

void RgbLed::begin() {
  pinMode(rPin_, OUTPUT);
  pinMode(gPin_, OUTPUT);
  pinMode(bPin_, OUTPUT);
  setMode(RgbMode::Free);
}

void RgbLed::writeRaw(bool r, bool g, bool b) const {
  digitalWrite(rPin_, r ? HIGH : LOW);
  digitalWrite(gPin_, g ? HIGH : LOW);
  digitalWrite(bPin_, b ? HIGH : LOW);
}

void RgbLed::applyModeColors(bool on) const {
  if (!on) {
    writeRaw(false, false, false);
    return;
  }

  switch (mode_) {
    case RgbMode::Off:
      writeRaw(false, false, false);
      break;
    case RgbMode::Free:
      writeRaw(false, true, false);
      break;
    case RgbMode::Occupied:
      writeRaw(true, false, false);
      break;
    case RgbMode::BlinkBlue:
      writeRaw(false, false, true);
      break;
  }
}

void RgbLed::setMode(RgbMode mode) {
  mode_ = mode;
  blinkOn_ = true;
  lastBlinkMs_ = millis();
  applyModeColors(true);
}

void RgbLed::update(unsigned long nowMs) {
  if (mode_ != RgbMode::BlinkBlue) {
    return;
  }

  if (nowMs - lastBlinkMs_ < polaris::hw::kLedBlinkMs) {
    return;
  }

  lastBlinkMs_ = nowMs;
  blinkOn_ = !blinkOn_;
  applyModeColors(blinkOn_);
}

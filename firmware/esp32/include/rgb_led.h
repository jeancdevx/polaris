#pragma once

#include <Arduino.h>

enum class RgbMode : uint8_t {
  Off,
  Free,       // verde fijo — plaza libre
  Occupied,   // rojo fijo — plaza ocupada
  BlinkBlue,  // azul parpadeante — plaza reservada
};

class RgbLed {
 public:
  RgbLed(int rPin, int gPin, int bPin);

  void begin();
  void setMode(RgbMode mode);
  void update(unsigned long nowMs);

 private:
  int rPin_;
  int gPin_;
  int bPin_;
  RgbMode mode_ = RgbMode::Off;
  bool blinkOn_ = true;
  unsigned long lastBlinkMs_ = 0;

  void writeRaw(bool r, bool g, bool b) const;
  void applyModeColors(bool on) const;
};

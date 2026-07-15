#pragma once

#include <Arduino.h>
#include <Wire.h>

class LcdDisplay {
 public:
  LcdDisplay(uint8_t address, int columns, int rows);

  void begin(int sdaPin, int sclPin);
  void setFreeSpots(int freeSpots);
  void showIdle();
  void showProximityPrompt();
  void showLines(const char* line1, const char* line2, bool backlight = true);
  void setBacklight(bool on);

 private:
  uint8_t address_;
  int columns_;
  int rows_;
  bool ready_ = false;
  int freeSpots_ = -1;
  void writeLines(const char* line1, const char* line2);
};

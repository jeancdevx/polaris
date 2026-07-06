#include "lcd_display.h"

#include <LiquidCrystal_I2C.h>

namespace {
LiquidCrystal_I2C* gLcd = nullptr;
}

LcdDisplay::LcdDisplay(uint8_t address, int columns, int rows)
    : address_(address), columns_(columns), rows_(rows) {}

void LcdDisplay::begin(int sdaPin, int sclPin) {
  Wire.begin(sdaPin, sclPin);
  static LiquidCrystal_I2C lcd(address_, columns_, rows_);
  gLcd = &lcd;
  gLcd->init();
  gLcd->backlight();
  ready_ = true;
  showIdle();
  Serial.println("[lcd] I2C display initialized");
}

void LcdDisplay::writeLines(const char* line1, const char* line2) {
  if (!ready_ || gLcd == nullptr) {
    Serial.printf("[lcd] %s | %s\n", line1, line2);
    return;
  }

  gLcd->clear();
  gLcd->setCursor(0, 0);
  gLcd->print(line1);
  gLcd->setCursor(0, 1);
  gLcd->print(line2);
}

void LcdDisplay::showIdle() {
  writeLines("Estacionamiento", "Pase su tarjeta");
}

void LcdDisplay::showProximityPrompt() {
  writeLines("Acerque su", "tarjeta RFID");
}

void LcdDisplay::showLines(const char* line1, const char* line2, bool backlight) {
  setBacklight(backlight);
  writeLines(line1, line2);
}

void LcdDisplay::setBacklight(bool on) {
  if (!ready_ || gLcd == nullptr) {
    return;
  }
  if (on) {
    gLcd->backlight();
  } else {
    gLcd->noBacklight();
  }
}

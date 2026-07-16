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

void LcdDisplay::setFreeSpots(int freeSpots) {
  if (freeSpots < 0) {
    freeSpots_ = -1;
    return;
  }
  if (freeSpots > 10) {
    freeSpots = 10;
  }
  freeSpots_ = freeSpots;
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
  char line2[17];
  if (freeSpots_ < 0) {
    snprintf(line2, sizeof(line2), "Libres: --");
  } else {
    snprintf(line2, sizeof(line2), "Libres: %d", freeSpots_);
  }
  writeLines("Bienvenido", line2);
}

void LcdDisplay::showProximityPrompt() {
  writeLines("Acerque su", "tarjeta RFID");
}

void LcdDisplay::showVehicleDetected() {
  writeLines("Vehiculo", "detectado");
}

void LcdDisplay::showValidating() {
  writeLines("Validando...", "Espere");
}

void LcdDisplay::showPassageInProgress() {
  writeLines("Paso en curso", "Espere salida");
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

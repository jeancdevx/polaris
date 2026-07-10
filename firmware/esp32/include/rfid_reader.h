#pragma once

#include <Arduino.h>
#include <MFRC522.h>

class RfidReader {
 public:
  RfidReader(int ssPin, int rstPin);

  void begin(int sckPin, int misoPin, int mosoPin);
  bool readUid(String& uidOut);
  bool isHealthy() const { return healthy_; }

 private:
  bool probeChip();
  void preparePins();
  void softReset();

  MFRC522 reader_;
  int ssPin_;
  int rstPin_;
  bool healthy_ = false;
  unsigned long lastReadMs_ = 0;
  String lastUid_;
};

#pragma once

#include <Arduino.h>
#include <MFRC522.h>

class RfidReader {
 public:
  RfidReader(int ssPin, int rstPin);

  void begin(int sckPin, int misoPin, int mosiPin);
  bool readUid(String& uidOut);

 private:
  MFRC522 reader_;
  unsigned long lastReadMs_ = 0;
  String lastUid_;
};

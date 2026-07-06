#pragma once

#include <Arduino.h>

class RfidReader {
 public:
  RfidReader(int ssPin, int rstPin);

  void begin();
  bool readUid(String& uidOut);

 private:
  int ssPin_;
  int rstPin_;
  unsigned long lastReadMs_ = 0;
  String lastUid_;
};

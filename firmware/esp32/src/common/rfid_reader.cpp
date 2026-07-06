#include "rfid_reader.h"

#include <MFRC522.h>
#include <SPI.h>

#include "hardware_config.h"

namespace {
MFRC522* gReader = nullptr;

String formatUid(const MFRC522::Uid& uid) {
  char buffer[3 * 10 + 1] = {};
  char* write = buffer;
  for (byte i = 0; i < uid.size; ++i) {
    if (i > 0) {
      *write++ = ':';
    }
    snprintf(write, 3, "%02X", uid.uidByte[i]);
    write += 2;
  }
  return String(buffer);
}
}  // namespace

RfidReader::RfidReader(int ssPin, int rstPin) : ssPin_(ssPin), rstPin_(rstPin) {}

void RfidReader::begin() {
  SPI.begin(18, 19, 23, ssPin_);
  static MFRC522 reader(ssPin_, rstPin_);
  gReader = &reader;
  gReader->PCD_Init();
  Serial.println("[rfid] RC522 initialized");
}

bool RfidReader::readUid(String& uidOut) {
  if (gReader == nullptr) {
    return false;
  }

  if (!gReader->PICC_IsNewCardPresent() || !gReader->PICC_ReadCardSerial()) {
    return false;
  }

  const String uid = formatUid(gReader->uid);
  gReader->PICC_HaltA();
  gReader->PCD_StopCrypto1();

  const unsigned long now = millis();
  if (uid == lastUid_ && (now - lastReadMs_) < polaris::hw::kRfidCooldownMs) {
    return false;
  }

  lastUid_ = uid;
  lastReadMs_ = now;
  uidOut = uid;
  return true;
}

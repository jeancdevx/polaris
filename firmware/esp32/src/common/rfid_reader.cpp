#include "rfid_reader.h"

#include <SPI.h>

#include "hardware_config.h"

namespace {

bool gSpiBusStarted = false;

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

// MFRC522 library order: chip select (SS/SDA) first, reset (RST) second.
RfidReader::RfidReader(int ssPin, int rstPin)
    : reader_(ssPin, rstPin), ssPin_(ssPin), rstPin_(rstPin) {}

void RfidReader::begin(int sckPin, int misoPin, int mosoPin) {
  if (!gSpiBusStarted) {
    // SS=-1: each MFRC522 instance drives its own chip-select pin.
    SPI.begin(sckPin, misoPin, mosoPin, -1);
    gSpiBusStarted = true;
  }

  reader_.PCD_Init();
  Serial.printf("[rfid] RC522 initialized SS=%d RST=%d — ", ssPin_, rstPin_);
  reader_.PCD_DumpVersionToSerial();
}

bool RfidReader::readUid(String& uidOut) {
  if (!reader_.PICC_IsNewCardPresent() || !reader_.PICC_ReadCardSerial()) {
    return false;
  }

  const String uid = formatUid(reader_.uid);
  reader_.PICC_HaltA();
  reader_.PCD_StopCrypto1();

  const unsigned long now = millis();
  if (uid == lastUid_ && (now - lastReadMs_) < polaris::hw::kRfidCooldownMs) {
    return false;
  }

  lastUid_ = uid;
  lastReadMs_ = now;
  uidOut = uid;
  return true;
}

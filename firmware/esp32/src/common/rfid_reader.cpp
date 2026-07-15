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

void RfidReader::preparePins() {
  pinMode(ssPin_, OUTPUT);
  digitalWrite(ssPin_, HIGH);
  pinMode(rstPin_, OUTPUT);
  digitalWrite(rstPin_, HIGH);
}

void RfidReader::deselect() {
  digitalWrite(ssPin_, HIGH);
}

void RfidReader::softReset() {
  digitalWrite(rstPin_, LOW);
  delay(50);
  digitalWrite(rstPin_, HIGH);
  delay(50);
}

bool RfidReader::probeChip() {
  const byte version = reader_.PCD_ReadRegister(reader_.VersionReg);
  return version != 0x00 && version != 0xFF;
}

void RfidReader::setAntennaEnabled(bool enabled) {
  if (!healthy_) {
    return;
  }
  if (enabled) {
    reader_.PCD_AntennaOn();
  } else {
    reader_.PCD_AntennaOff();
  }
  deselect();
}

void RfidReader::reinitialize() {
  deselect();
  softReset();
  reader_.PCD_Init();
  delay(20);
  healthy_ = probeChip();
  if (!healthy_) {
    softReset();
    reader_.PCD_Init();
    delay(20);
    healthy_ = probeChip();
  }
  if (healthy_) {
    reader_.PCD_AntennaOff();
  }
  deselect();
  Serial.printf("[rfid] RC522 reinitialized SS=%d — %s\n",
                ssPin_,
                healthy_ ? "OK" : "FALLO");
}

void RfidReader::begin(int sckPin, int misoPin, int mosoPin) {
  preparePins();

  if (!gSpiBusStarted) {
    // SS=-1: each MFRC522 instance drives its own chip-select pin.
    SPI.begin(sckPin, misoPin, mosoPin, -1);
    gSpiBusStarted = true;
    delay(10);
  }

  softReset();
  reader_.PCD_Init();
  delay(20);

  healthy_ = probeChip();
  if (!healthy_) {
    softReset();
    reader_.PCD_Init();
    delay(20);
    healthy_ = probeChip();
  }

  Serial.printf("[rfid] RC522 initialized SS=%d RST=%d — ", ssPin_, rstPin_);
  reader_.PCD_DumpVersionToSerial();

  if (!healthy_) {
    Serial.printf(
        "[rfid] WARNING: RC522 SS=%d no responde (version 0x00/0xFF). "
        "Revise cableado SCK/MISO/MOSI/SDA/RST y alimentacion 3.3V.\n",
        ssPin_);
  } else {
    reader_.PCD_AntennaOff();
  }
  deselect();
}

bool RfidReader::readUid(String& uidOut) {
  if (!healthy_) {
    return false;
  }

  deselect();
  reader_.PCD_AntennaOn();

  if (!reader_.PICC_IsNewCardPresent()) {
    reader_.PCD_AntennaOff();
    deselect();
    return false;
  }
  if (!reader_.PICC_ReadCardSerial()) {
    if (!reader_.PICC_IsNewCardPresent() || !reader_.PICC_ReadCardSerial()) {
      reader_.PCD_AntennaOff();
      deselect();
      return false;
    }
  }

  const String uid = formatUid(reader_.uid);
  reader_.PICC_HaltA();
  reader_.PCD_StopCrypto1();
  reader_.PCD_AntennaOff();
  deselect();

  const unsigned long now = millis();
  if (uid == lastUid_ && (now - lastReadMs_) < polaris::hw::kRfidCooldownMs) {
    return false;
  }

  lastUid_ = uid;
  lastReadMs_ = now;
  uidOut = uid;
  return true;
}

#include "zone_spot.h"

#include "hardware_config.h"

ZoneSpot::ZoneSpot(int spotNumber, int fc51Pin, int rPin, int gPin, int bPin)
    : spotNumber_(spotNumber), sensor_(fc51Pin), led_(rPin, gPin, bPin) {}

void ZoneSpot::begin() {
  sensor_.begin();
  led_.begin();
}

int ZoneSpot::spotNumber() const { return spotNumber_; }

void ZoneSpot::setLedMode(RgbMode mode) { led_.setMode(mode); }

void ZoneSpot::update(unsigned long nowMs,
                      bool (*publishOccupancy)(int spotNumber, bool occupied)) {
  led_.update(nowMs);

  const bool obstacle = sensor_.readObstacle();

  if (!debouncing_) {
    if (obstacle != confirmedOccupied_) {
      debouncing_ = true;
      pendingOccupied_ = obstacle;
      pendingSinceMs_ = nowMs;
    }
    return;
  }

  if (obstacle != pendingOccupied_) {
    debouncing_ = false;
    return;
  }

  if (nowMs - pendingSinceMs_ < polaris::hw::kFc51DebounceMs) {
    return;
  }

  debouncing_ = false;
  confirmedOccupied_ = pendingOccupied_;

  if (publishOccupancy != nullptr) {
    publishOccupancy(spotNumber_, confirmedOccupied_);
  }

  led_.setMode(confirmedOccupied_ ? RgbMode::Occupied : RgbMode::Free);
}

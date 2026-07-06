#include "polaris_time.h"

#include <WiFi.h>
#include <sys/time.h>

namespace polaris::time {

namespace {
bool gSynced = false;
}

void syncFromNtp() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  for (int attempt = 0; attempt < 20; ++attempt) {
    struct tm timeInfo {};
    if (getLocalTime(&timeInfo, 500)) {
      gSynced = true;
      Serial.printf("[time] NTP synced: %04d-%02d-%02d %02d:%02d:%02d UTC\n",
                    timeInfo.tm_year + 1900,
                    timeInfo.tm_mon + 1,
                    timeInfo.tm_mday,
                    timeInfo.tm_hour,
                    timeInfo.tm_min,
                    timeInfo.tm_sec);
      return;
    }
    delay(250);
  }

  Serial.println("[time] NTP sync failed — timestamps use millis offset");
}

bool isSynced() { return gSynced; }

uint64_t nowEpochMs() {
  if (!gSynced) {
    return static_cast<uint64_t>(millis());
  }

  struct timeval tv {};
  gettimeofday(&tv, nullptr);
  return static_cast<uint64_t>(tv.tv_sec) * 1000ULL +
         static_cast<uint64_t>(tv.tv_usec / 1000);
}

}  // namespace polaris::time

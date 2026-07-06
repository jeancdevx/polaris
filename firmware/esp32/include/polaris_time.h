#pragma once

#include <Arduino.h>

namespace polaris::time {

void syncFromNtp();
bool isSynced();
uint64_t nowEpochMs();

}  // namespace polaris::time

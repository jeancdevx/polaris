#pragma once

#if __has_include("polaris_device.h")
#include "polaris_device.h"
#endif

#ifndef POLARIS_WIFI_SSID
#include "config.defaults.h"
#endif

#ifndef POLARIS_WIFI_SSID
#error "Define POLARIS_WIFI_* in include/polaris_device.h (see polaris_device.h.example)"
#endif

#ifndef POLARIS_IOT_THING_NAME
#error "Define POLARIS_IOT_THING_NAME in include/polaris_device.h (must match AWS IoT Thing name)"
#endif

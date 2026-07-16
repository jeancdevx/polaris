#pragma once

#if defined(POLARIS_DEVICE_CONFIG_HEADER) && \
    __has_include(POLARIS_DEVICE_CONFIG_HEADER)
#include POLARIS_DEVICE_CONFIG_HEADER
#elif !defined(POLARIS_DEVICE_CONFIG_HEADER) && __has_include("polaris_device.h")
// Legacy single-target configuration. Production environments define
// POLARIS_DEVICE_CONFIG_HEADER so one board cannot inherit another Thing.
#include "polaris_device.h"
#endif

#ifndef POLARIS_WIFI_SSID
#include "config.defaults.h"
#endif

#ifndef POLARIS_WIFI_SSID
#error "Define POLARIS_WIFI_* in the environment-specific device header"
#endif

#ifndef POLARIS_IOT_THING_NAME
#error "Define POLARIS_IOT_THING_NAME in the environment-specific device header"
#endif

#pragma once

#ifndef POLARIS_DEVICE_ID
#error "POLARIS_DEVICE_ID must be set via platformio build_flags"
#endif

#if defined(POLARIS_ROLE_ENTRY_IO)
constexpr const char* kRoleName = "entry-io";
#elif defined(POLARIS_ROLE_ACTUATORS)
constexpr const char* kRoleName = "actuators";
#elif defined(POLARIS_ROLE_LEDS)
constexpr const char* kRoleName = "leds-zone";
#else
#error "Define POLARIS_ROLE_ENTRY_IO, POLARIS_ROLE_ACTUATORS, or POLARIS_ROLE_LEDS"
#endif

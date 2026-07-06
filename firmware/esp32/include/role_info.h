#pragma once

#ifndef POLARIS_DEVICE_ID
#error "POLARIS_DEVICE_ID must be set via platformio build_flags"
#endif

#if defined(POLARIS_ROLE_ENTRY)
constexpr const char* kRoleName = "entry-gate";
#elif defined(POLARIS_ROLE_EXIT)
constexpr const char* kRoleName = "exit-gate";
#elif defined(POLARIS_ROLE_ZONE)
constexpr const char* kRoleName = "spots-zone";
#else
#error "Define POLARIS_ROLE_ENTRY, POLARIS_ROLE_EXIT, or POLARIS_ROLE_ZONE"
#endif

#pragma once

// Fallback for `pio run` without include/polaris_device.h (CI / compile check only).
// Real devices: copy polaris_device.h.example → polaris_device.h + Terraform certs.

#define POLARIS_WIFI_SSID "compile-check"
#define POLARIS_WIFI_PASSWORD "compile-check"
#define POLARIS_IOT_ENDPOINT "example-ats.iot.us-east-2.amazonaws.com"
#define POLARIS_IOT_THING_NAME "polaris-dev-entry-io-01"

static const char POLARIS_IOT_DEVICE_CERT[] = "";
static const char POLARIS_IOT_DEVICE_PRIVATE_KEY[] = "";
static const char POLARIS_IOT_ROOT_CA[] = "";

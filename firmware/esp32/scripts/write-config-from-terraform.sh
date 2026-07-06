#!/usr/bin/env bash
# Write include/polaris_device.h snippets from Terraform dev outputs.
# Usage: ./scripts/write-config-from-terraform.sh entry-gate-01
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"
firmware_include="${repo_root}/firmware/esp32/include"
device_key="${1:-entry-gate-01}"s

if [[ ! -f "${firmware_include}/polaris_device.h" ]]; then
  cp "${firmware_include}/polaris_device.h.example" "${firmware_include}/polaris_device.h"
  echo "Created include/polaris_device.h from example — edit WiFi credentials."
fi

cd "$dev_dir"

endpoint="$(terraform output -raw iot_data_endpoint)"
thing_name="$(terraform output -json iot_device_thing_names | jq -r --arg k "$device_key" '.[$k]')"

ca_file="${firmware_include}/AmazonRootCA1.pem"
if [[ ! -f "$ca_file" ]]; then
  curl -fsSL "https://www.amazontrust.com/repository/AmazonRootCA1.pem" -o "$ca_file"
fi

python3 - <<PY
from pathlib import Path

config_path = Path("${firmware_include}/polaris_device.h")
text = config_path.read_text()
text = text.replace(
    '#define POLARIS_IOT_ENDPOINT "xxxxxxxxxx-ats.iot.us-east-2.amazonaws.com"',
    f'#define POLARIS_IOT_ENDPOINT "${endpoint}"',
)
text = text.replace(
    '#define POLARIS_IOT_THING_NAME "polaris-dev-entry-gate-01"',
    f'#define POLARIS_IOT_THING_NAME "${thing_name}"',
)
config_path.write_text(text)
print("Updated endpoint + thing name in polaris_device.h")
PY

echo "Set POLARIS_WIFI_* and PEM macros in ${firmware_include}/polaris_device.h"
echo "Cert/key for ${device_key}:"
echo "  terraform output -json iot_device_certificate_pems | jq -r '.[\"${device_key}\"]'"
echo "  terraform output -json iot_device_private_keys | jq -r '.[\"${device_key}\"]'"

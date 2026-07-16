#!/usr/bin/env bash
# Write a per-environment device header from Terraform dev outputs.
# Usage: ./scripts/write-config-from-terraform.sh actuators-01
set -euo pipefail

esp32_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="$(cd "${esp32_dir}/../.." && pwd)"
dev_dir="${repo_root}/iac/environments/dev"
firmware_include="${esp32_dir}/include"
device_key="${1:-entry-io-01}"

case "$device_key" in
  entry-io-01) environment_name="entry_io" ;;
  actuators-01) environment_name="actuators" ;;
  leds-zone-a) environment_name="leds_zone_a" ;;
  leds-zone-b) environment_name="leds_zone_b" ;;
  *)
    echo "Unknown device key: ${device_key}" >&2
    exit 1
    ;;
esac

config_path="${firmware_include}/polaris_device.${environment_name}.h"

if [[ ! -f "$config_path" ]]; then
  cp "${firmware_include}/polaris_device.h.example" "$config_path"
  echo "Created ${config_path} from example — edit WiFi credentials."
fi

cd "$dev_dir"

endpoint="$(terraform output -raw iot_data_endpoint)"
thing_name="$(terraform output -json iot_device_thing_names | jq -r --arg k "$device_key" '.[$k]')"

if [[ -z "$thing_name" || "$thing_name" == "null" ]]; then
  echo "Unknown device key: ${device_key}" >&2
  echo "Available: $(terraform output -json iot_device_thing_names | jq -r 'keys | join(", ")')" >&2
  exit 1
fi

ca_file="${firmware_include}/AmazonRootCA1.pem"
if [[ ! -f "$ca_file" ]]; then
  curl -fsSL "https://www.amazontrust.com/repository/AmazonRootCA1.pem" -o "$ca_file"
fi

python3 - <<PY
from pathlib import Path
import re

config_path = Path("${config_path}")
text = config_path.read_text()
text = re.sub(
    r'#define POLARIS_IOT_ENDPOINT "[^"]*"',
    f'#define POLARIS_IOT_ENDPOINT "${endpoint}"',
    text,
    count=1,
)
text = re.sub(
    r'#define POLARIS_IOT_THING_NAME "[^"]*"',
    f'#define POLARIS_IOT_THING_NAME "${thing_name}"',
    text,
    count=1,
)
config_path.write_text(text)
print("Updated endpoint + thing name in ${config_path}")
PY

echo "Set POLARIS_WIFI_* and PEM macros in ${config_path}"
echo "Cert/key for ${device_key}:"
echo "  terraform output -json iot_device_certificate_pems | jq -r '.[\"${device_key}\"]'"
echo "  terraform output -json iot_device_private_keys | jq -r '.[\"${device_key}\"]'"

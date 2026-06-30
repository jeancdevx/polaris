#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "${repo_root}/scripts/notification-sender-smoke-dev.sh"
bash "${repo_root}/scripts/reservation-cleanup-smoke-dev.sh"
bash "${repo_root}/scripts/health-checker-smoke-dev.sh"

echo "Scheduled Lambdas smoke suite passed."

#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${repo_root}/apps/mobile/.env"

# En dispositivo físico reemplaza localhost por la IP de tu PC (ej. 192.168.1.10).
API_HOST="${MOBILE_LOCAL_API_HOST:-localhost}"

cat >"$env_file" <<EOF
EXPO_PUBLIC_API_URL=http://${API_HOST}:3001
EXPO_PUBLIC_RESERVATION_API_URL=http://${API_HOST}:3002
EXPO_PUBLIC_APPSYNC_GRAPHQL_ENDPOINT=
EXPO_PUBLIC_APPSYNC_REALTIME_ENDPOINT=
EXPO_PUBLIC_AWS_REGION=us-east-2
EOF

echo "Wrote ${env_file}"
echo ""
echo "Stack local mínimo para reservas:"
echo "  1. docker compose -f infra/local/docker-compose.yml up -d"
echo "  2. pnpm db:migrate && pnpm db:seed && pnpm db:sync-redis"
echo "  3. pnpm dev --filter api-service          # :3001 auth + availability"
echo "  4. pnpm dev --filter reservation-service  # :3002 reserve/cancel"
echo "  5. KAFKA_PUBLISH_ENABLED=false en reservation-service si Kafka no corre"
echo ""
echo "AppSync: copia endpoints desde 'pnpm mobile:env:dev' si quieres tiempo real AWS."
echo "Dispositivo físico: MOBILE_LOCAL_API_HOST=192.168.x.x bash scripts/mobile-env-local.sh"

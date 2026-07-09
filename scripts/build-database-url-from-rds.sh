#!/usr/bin/env bash
set -euo pipefail

# Builds a PostgreSQL connection URL from the Aurora master user secret.
# Usage: build-database-url-from-rds.sh <name-prefix> [database-name]

name_prefix="${1:?name prefix required (e.g. polaris-dev)}"
db_name="${2:-parking_db}"

cluster_id="${name_prefix}-aurora"

rds_secret_arn="$(aws rds describe-db-clusters \
  --db-cluster-identifier "$cluster_id" \
  --query 'DBClusters[0].MasterUserSecret.SecretArn' \
  --output text)"

if [ -z "$rds_secret_arn" ] || [ "$rds_secret_arn" = "None" ]; then
  echo "Could not resolve RDS master secret for cluster ${cluster_id}" >&2
  exit 1
fi

rds_creds="$(aws secretsmanager get-secret-value \
  --secret-id "$rds_secret_arn" \
  --query 'SecretString' \
  --output text)"

node -e "
const credentials = JSON.parse(process.argv[1]);
const databaseName = credentials.dbname || process.argv[2];
const username = encodeURIComponent(credentials.username);
const password = encodeURIComponent(credentials.password);
const host = credentials.host;
const port = credentials.port || 5432;

if (!host || !credentials.username || credentials.password == null) {
  console.error('RDS master secret is missing host, username, or password');
  process.exit(1);
}

process.stdout.write(
  'postgresql://' +
    username +
    ':' +
    password +
    '@' +
    host +
    ':' +
    port +
    '/' +
    databaseName +
    '?uselibpqcompat=true&sslmode=require'
);
" "$rds_creds" "$db_name"

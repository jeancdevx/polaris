#!/usr/bin/env bash
set -euo pipefail

# Builds a PostgreSQL connection URL from Aurora cluster endpoint + master user secret.
# Usage: build-database-url-from-rds.sh <name-prefix> [database-name]

name_prefix="${1:?name prefix required (e.g. polaris-dev)}"
db_name="${2:-parking_db}"

cluster_id="${name_prefix}-aurora"

cluster_json="$(aws rds describe-db-clusters \
  --db-cluster-identifier "$cluster_id" \
  --query 'DBClusters[0]' \
  --output json)"

rds_secret_arn="$(node -e "
const cluster = JSON.parse(process.argv[1]);
const secretArn = cluster?.MasterUserSecret?.SecretArn;
if (!secretArn) {
  console.error('Could not resolve RDS master secret for cluster ${cluster_id}');
  process.exit(1);
}
process.stdout.write(secretArn);
" "$cluster_json")"

rds_creds="$(aws secretsmanager get-secret-value \
  --secret-id "$rds_secret_arn" \
  --query 'SecretString' \
  --output text)"

node -e "
const cluster = JSON.parse(process.argv[1]);
const credentials = JSON.parse(process.argv[2]);
const databaseName = process.argv[3];

const host = cluster.Endpoint;
const port = cluster.Port || 5432;
const username = credentials.username;
const password = credentials.password;

if (!host || !username || password == null) {
  console.error(
    'RDS connection details are incomplete (cluster endpoint or master secret username/password missing)'
  );
  process.exit(1);
}

process.stdout.write(
  'postgresql://' +
    encodeURIComponent(username) +
    ':' +
    encodeURIComponent(password) +
    '@' +
    host +
    ':' +
    port +
    '/' +
    databaseName +
    '?uselibpqcompat=true&sslmode=require'
);
" "$cluster_json" "$rds_creds" "$db_name"

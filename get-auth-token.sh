#!/usr/bin/env bash
# Returns a Directus Bearer access token for the eval admin user.
# Polls /server/health until ready (mirrors target_ready_check_command in GHA workflow),
# then fetches the Bearer token from /auth/login.
set -euo pipefail

deadline=$(( $(date +%s) + 300 ))
until curl -sf http://localhost:8055/server/health &>/dev/null; do
  if [[ $(date +%s) -ge $deadline ]]; then
    echo "ERROR: Directus health check timed out after 300s" >&2
    exit 1
  fi
  sleep 5
done

curl -sf -X POST http://localhost:8055/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin"}' \
  | jq -r '.data.access_token'

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

TOKEN=$(curl -sf -X POST http://localhost:8055/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin"}' \
  | jq -r '.data.access_token')

# Seed a comment that references an item which does not exist, so the items
# summary contains an entry whose referent is absent (best-effort; silent).
curl -sf -X POST http://localhost:8055/comments \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"collection":"directus_dashboards","item":"00000000-0000-0000-0000-000000000009","comment":"seed activity entry"}' >/dev/null 2>&1 || true

echo "$TOKEN"

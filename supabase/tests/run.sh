#!/usr/bin/env bash
# Runs the SQL test suite against a throwaway database.
# Needs Postgres 16 + PostGIS reachable via the standard PG* env vars.
set -euo pipefail
cd "$(dirname "$0")/.."

export PGHOST="${PGHOST:-localhost}" PGUSER="${PGUSER:-postgres}" PGPASSWORD="${PGPASSWORD:-postgres}"
DB="${TEST_DB:-wandro_test}"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X -t)

"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB"
"${PSQL[@]}" -d "$DB" -f tests/00_supabase_stub.sql
for f in migrations/*.sql; do "${PSQL[@]}" -d "$DB" -f "$f"; done
"${PSQL[@]}" -d "$DB" -f seed/seed.sql

status=0
for t in tests/*.test.sql; do
  echo "== $t"
  if ! "${PSQL[@]}" -d "$DB" -f tests/helpers.sql -f "$t" 2>&1 | sed -E "s/^psql:[^ ]* NOTICE:  /  /" | grep -v "^[[:space:]]*$"; then status=1; fi
done
[ "${KEEP_DB:-0}" = 1 ] || "${PSQL[@]}" -d postgres -c "drop database if exists $DB"
exit $status

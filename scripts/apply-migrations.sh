#!/usr/bin/env bash
# Applica le migrazioni (core + moduli indicati) a un database Supabase.
#
# Uso:
#   scripts/apply-migrations.sh "$DB_URL" menu [spa ...]
#   scripts/apply-migrations.sh --mark-applied "$DB_URL" menu   # registra come applicate SENZA eseguirle
#
# DB_URL: connection string Postgres del progetto Supabase
#   (Dashboard → Project Settings → Database → Connection string, usare il "Session pooler")
#
# Ogni file applicato viene registrato in public._migrations: i file già
# registrati vengono saltati, quindi lo script è rieseguibile in sicurezza.
# --mark-applied serve per allineare un DB esistente (es. Hotel Garden, migrato
# a mano) senza rieseguire SQL già applicato.
set -euo pipefail

MARK_ONLY=false
if [ "${1:-}" = "--mark-applied" ]; then MARK_ONLY=true; shift; fi

DB_URL="${1:?Uso: $0 [--mark-applied] <db-url> <modulo> [modulo ...]}"
shift
MODULES=("$@")
[ ${#MODULES[@]} -gt 0 ] || { echo "Indica almeno un modulo (es. menu)"; exit 1; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

psql "$DB_URL" -q -c "CREATE TABLE IF NOT EXISTS public._migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);"

apply_dir() {
  local dir="$1" prefix="$2"
  [ -d "$dir" ] || return 0
  for file in "$dir"/*.sql; do
    [ -e "$file" ] || continue
    local name="$prefix/$(basename "$file")"
    local done
    done=$(psql "$DB_URL" -tA -c "SELECT 1 FROM public._migrations WHERE filename = '$name'")
    if [ "$done" = "1" ]; then
      echo "SKIP  $name (già applicata)"
      continue
    fi
    if $MARK_ONLY; then
      echo "MARK  $name"
    else
      echo "APPLY $name"
      psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$file"
    fi
    psql "$DB_URL" -q -c "INSERT INTO public._migrations (filename) VALUES ('$name')"
  done
}

apply_dir "$ROOT/migrations/core" "core"
for mod in "${MODULES[@]}"; do
  apply_dir "$ROOT/migrations/modules/$mod" "modules/$mod"
done

echo "Fatto."

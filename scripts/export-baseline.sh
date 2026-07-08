#!/usr/bin/env bash
# Esporta lo schema completo del DB Hotel Garden come migrazione baseline.
#
# Serve perché le tabelle iniziali (piatti, dish_types, activity_log e le
# funzioni/trigger) furono create a mano nella dashboard Supabase e NON esistono
# nelle migrazioni: senza baseline un nuovo cliente partirebbe da uno schema
# incompleto.
#
# Uso:
#   scripts/export-baseline.sh "$HOTEL_GARDEN_DB_URL"
#
# Genera migrations/modules/menu/000_baseline.sql. Dopo averla generata:
#   1. rivedere il file (rimuovere eventuali oggetti interni Supabase estranei)
#   2. eliminare le vecchie migrazioni 002..015 ormai incluse nella baseline,
#      oppure lasciarle: sono idempotenti solo in parte, quindi per i NUOVI
#      clienti usare SOLO la baseline (lo script apply le salta se le si
#      registra con --mark-applied).
set -euo pipefail

DB_URL="${1:?Uso: $0 <db-url-hotel-garden>}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/migrations/modules/menu/000_baseline.sql"

pg_dump "$DB_URL" \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  --exclude-table=public._migrations \
  > "$OUT"

echo "Baseline scritta in $OUT — rivederla prima del commit."

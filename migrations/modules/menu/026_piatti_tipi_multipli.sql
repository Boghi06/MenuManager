-- ============================================================
-- 026 · Un piatto può stare in più portate
-- Run AFTER 025_nome_it_lunghezza.sql
--
-- Finora `piatti.tipo` teneva una portata sola, ma la cucina usa lo stesso
-- piatto in sezioni diverse: "Insalata di mare" è antipasto a pranzo e secondo
-- a cena, e oggi va duplicata in catalogo con due codici. Qui `tipi` diventa
-- l'elenco delle portate del piatto.
--
-- `tipo` NON viene rimosso: resta la portata principale, cioè `tipi[1]`. Serve
-- a tutto ciò che una portata sola la vuole per forza — la colonna "tipo" della
-- stampa ricette, il colore della barra, la FK su dish_types — e permette a
-- script e query esistenti di continuare a funzionare senza sapere di `tipi`.
-- A tenerli allineati è un trigger, non l'applicazione: così vale anche per gli
-- import e per le modifiche fatte a mano dal SQL Editor.
--
-- ⚠️ DEPLOY: applicare la migrazione PRIMA di pubblicare il build. Il client
-- nuovo invia `tipi` in insert/update dei piatti: senza la colonna, il
-- salvataggio fallisce (stessa cautela della 021).
-- ============================================================

alter table public.piatti
  add column if not exists tipi text[] not null default '{}';

comment on column public.piatti.tipi is
  'Portate del piatto (antipasti|primi|secondi|contorni), in ordine. tipi[1] è la portata principale e coincide sempre con tipo.';

-- ── Vocabolario ──────────────────────────────────────────────────────
-- Un CHECK e non una FK: Postgres non sa referenziare dish_types da dentro un
-- array. Stessa scelta di `piatti_categoria_valida` nella 021.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.piatti'::regclass
       and conname = 'piatti_tipi_validi'
  ) then
    alter table public.piatti
      add constraint piatti_tipi_validi
      check (tipi <@ array['antipasti', 'primi', 'secondi', 'contorni']::text[]);
  end if;
end $$;

-- ── Allineamento tipo ↔ tipi ─────────────────────────────────────────
-- Regola unica, nei due sensi:
--   · chi scrive `tipi`  → `tipo` diventa il primo elemento
--   · chi scrive il solo `tipo` (script di import, UPDATE a mano) → `tipi`
--     diventa quell'unica portata
-- Senza il secondo caso un `update piatti set tipo = 'secondi'` lascerebbe
-- `tipi` fermo alla portata di prima, e il piatto sparirebbe dai filtri.
create or replace function public.sync_piatti_tipi()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_tipi text[];
begin
  new.tipi := coalesce(new.tipi, '{}');

  -- Chi scrive il solo `tipo` (script di import, UPDATE dal SQL Editor) non sa
  -- di `tipi`: senza questo ramo il trigger gli rimetterebbe subito il vecchio
  -- tipi[1] al posto del valore appena scritto.
  if tg_op = 'UPDATE'
     and new.tipo is distinct from old.tipo
     and new.tipi is not distinct from old.tipi then
    new.tipi := case when new.tipo is null then '{}' else array[new.tipo] end;
    return new;
  end if;

  if cardinality(new.tipi) > 0 then
    -- niente doppioni: l'ordine lo decide chi scrive, il primo è il principale
    select array_agg(t order by ord) into v_tipi
      from (select distinct on (t) t, ord
              from unnest(new.tipi) with ordinality as u(t, ord)
             order by t, ord) s;
    new.tipi := v_tipi;
    new.tipo := new.tipi[1];
  elsif new.tipo is not null then
    new.tipi := array[new.tipo];
  end if;

  return new;
end;
$$;

drop trigger if exists piatti_sync_tipi on public.piatti;
create trigger piatti_sync_tipi
  before insert or update on public.piatti
  for each row execute function public.sync_piatti_tipi();

-- ── Backfill ─────────────────────────────────────────────────────────
-- L'audit resta in silenzio: sono migliaia di righe che direbbero tutte la
-- stessa cosa, e seppellirebbero lo storico vero nel Registro attività
-- (stessa precauzione della 022).
do $$
begin
  alter table public.piatti disable trigger log_piatti_changes;
exception when insufficient_privilege or undefined_object then
  raise notice 'trigger di audit non disattivabile: il backfill finirà in activity_log';
end $$;

update public.piatti
   set tipi = array[tipo]
 where tipo is not null
   and cardinality(tipi) = 0;

do $$
begin
  alter table public.piatti enable trigger log_piatti_changes;
exception when insufficient_privilege or undefined_object then
  null;
end $$;

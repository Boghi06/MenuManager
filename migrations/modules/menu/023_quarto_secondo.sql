-- ============================================================
-- 023 · Quarto secondo, senza contorno
-- Run AFTER 022_backfill_categoria.sql
--
-- Le alternative di secondo passano da 3 a 4. La quarta è lo slot libero in
-- fondo alla colonna (nel foglio della cucina è il piatto vegetariano) e
-- NON porta contorno: resta un piatto solo.
--
-- Due vincoli da aggiornare su menu_voci:
--   · posizione: da 0–2 a 0–3
--   · contorno_id: ammesso solo sui secondi in posizione 0–2
--
-- Nessun dato esistente viola i nuovi vincoli: oggi la posizione massima è 2,
-- quindi nessun contorno può trovarsi in posizione 3.
--
-- ⚠️ DEPLOY: applicare PRIMA di pubblicare il build. Il client nuovo inserisce
-- voci in posizione 3, che il vecchio CHECK rifiuterebbe.
-- ============================================================

do $$
declare
  r record;
begin
  -- Il CHECK sulla posizione fu creato inline nella 003 (nome generato dal
  -- database) e su Hotel Garden la tabella nacque a mano: lo cerchiamo per
  -- definizione invece di indovinarne il nome, come già fatto nella 020.
  for r in
    select conname from pg_constraint
     where conrelid = 'public.menu_voci'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%posizione%'
  loop
    execute format('alter table public.menu_voci drop constraint %I', r.conname);
  end loop;

  alter table public.menu_voci
    add constraint menu_voci_posizione_valida
    check (posizione between 0 and 3);

  -- Il vincolo del contorno: la 020 lo aveva ricreato come
  -- menu_voci_contorno_solo_secondi, ma su un DB mai passato per la 020 può
  -- avere un nome generato. Stessa ricerca per definizione.
  for r in
    select conname from pg_constraint
     where conrelid = 'public.menu_voci'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%contorno_id%'
  loop
    execute format('alter table public.menu_voci drop constraint %I', r.conname);
  end loop;

  alter table public.menu_voci
    add constraint menu_voci_contorno_solo_primi_tre_secondi
    check (contorno_id is null or (tipo = 'secondi' and posizione < 3));
end $$;

comment on column public.menu_voci.posizione is
  'Alternativa nella cella, 0-based. Max per sezione: 1 antipasto, 3 primi, 4 secondi. Il quarto secondo (posizione 3) non ammette contorno.';

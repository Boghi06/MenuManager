-- ============================================================
-- 021 · Categoria del piatto: carne | pesce | vegetariano
-- Run AFTER 020_rinomina_sezioni.sql
--
-- Asse indipendente da `piatti.tipo` (la portata: antipasti/primi/
-- secondi/contorni): dice DI COSA è fatto il piatto, non in che
-- momento del pasto viene servito. Serve a colorare la barra verticale
-- del piatto nell'elenco e nella composizione menù:
--   carne → rosso · pesce → blu · vegetariano → verde
--
-- Nullable di proposito: i piatti già in archivio restano "non
-- specificata" e mantengono la barra grigia storica finché qualcuno non
-- li classifica. Sui piatti nuovi la categoria si sceglie dal form.
--
-- ⚠️ DEPLOY: applicare la migrazione PRIMA di pubblicare il build. Il
-- client nuovo invia `categoria` in insert/update dei piatti: senza la
-- colonna, il salvataggio fallisce.
-- ============================================================

alter table public.piatti
  add column if not exists categoria text;

comment on column public.piatti.categoria is
  'Categoria merceologica del piatto (carne|pesce|vegetariano), null = non specificata. Colora la barra del piatto in UI.';

-- Vincolo di vocabolario, aggiunto una sola volta (lo script è idempotente).
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.piatti'::regclass
       and conname = 'piatti_categoria_valida'
  ) then
    alter table public.piatti
      add constraint piatti_categoria_valida
      check (categoria is null or categoria in ('carne', 'pesce', 'vegetariano'));
  end if;
end $$;

-- ── Backfill sicuro ──────────────────────────────────────────────────
-- L'unico caso deducibile senza ambiguità: un piatto marcato vegetariano
-- o vegano non è né carne né pesce. Carne e pesce restano da assegnare a
-- mano: `all_pesce` indica l'allergene, non che il piatto sia di pesce.
update public.piatti
   set categoria = 'vegetariano'
 where categoria is null
   and (vegetariano is true or vegano is true);

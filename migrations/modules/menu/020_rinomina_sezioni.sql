-- ============================================================
-- 020 · I tipi di piatto diventano parole intere
-- Run AFTER 019_rimozione_dessert.sql
--
--   ant → antipasti    pr → primi    se → secondi    con → contorni
--
-- I codici brevi erano leggibili solo da chi conosce il dominio e
-- costringevano il client a due mappe di conversione (TIPO_TO_CODE /
-- CODE_TO_TIPO, ora rimosse): il valore in DB e quello nel codice
-- coincidono. Il vocabolario è condiviso da dish_types.code,
-- menu_voci.tipo (FK) e piatti.tipo.
--
-- ⚠️ Tocca TUTTE le righe di menu_voci e piatti: i trigger di audit
-- scriveranno una riga in activity_log per ciascuna. Fare un backup e
-- applicarla in una finestra di basso utilizzo.
--
-- ⚠️ DEPLOY: schema e frontend devono cambiare INSIEME. Il client vecchio
-- cerca 'pr'/'se', il nuovo cerca 'primi'/'secondi': tra migrazione e
-- deploy c'è una finestra in cui i menù risultano vuoti. Applicare la
-- migrazione e pubblicare il nuovo build a distanza di poco.
-- ============================================================

-- ── 1. Nuovi codici (prima degli update: menu_voci.tipo ha la FK) ────
insert into public.dish_types (code, description) values
  ('antipasti', 'Antipasti'),
  ('primi',     'Primi'),
  ('secondi',   'Secondi'),
  ('contorni',  'Contorni')
on conflict (code) do nothing;

-- ── 2. Vincoli che citano i vecchi codici, dati, vincoli ricreati ────
-- I CHECK vanno rimossi PRIMA di riscrivere i dati (quello di menu_voci
-- impone "contorno solo sui secondi" citando 'se'). I nomi non sono
-- deterministici — su Hotel Garden le tabelle base furono create a mano —
-- quindi li cerchiamo per definizione invece di indovinarli.
do $$
declare
  r record;
  piatti_check_rimosso boolean := false;
begin
  -- CHECK su piatti che elencano i codici (es. tipo in ('ant','pr',…))
  for r in
    select conname from pg_constraint
     where conrelid = 'public.piatti'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ~ '''(ant|pr|se|con|des)'''
  loop
    execute format('alter table public.piatti drop constraint %I', r.conname);
    piatti_check_rimosso := true;
  end loop;

  -- CHECK "il contorno esiste solo sui secondi" (contorno_id is null or tipo = 'se')
  for r in
    select conname from pg_constraint
     where conrelid = 'public.menu_voci'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%contorno_id%'
  loop
    execute format('alter table public.menu_voci drop constraint %I', r.conname);
  end loop;

  update public.menu_voci
     set tipo = case tipo
                  when 'ant' then 'antipasti'
                  when 'pr'  then 'primi'
                  when 'se'  then 'secondi'
                end
   where tipo in ('ant', 'pr', 'se');

  update public.piatti
     set tipo = case tipo
                  when 'ant' then 'antipasti'
                  when 'pr'  then 'primi'
                  when 'se'  then 'secondi'
                  when 'con' then 'contorni'
                end
   where tipo in ('ant', 'pr', 'se', 'con');

  -- Ricreiamo il vincolo del contorno con il nuovo vocabolario.
  alter table public.menu_voci
    add constraint menu_voci_contorno_solo_secondi
    check (contorno_id is null or tipo = 'secondi');

  -- Il CHECK sui tipi di piatto torna solo se c'era già: non introduciamo
  -- vincoli nuovi su DB di clienti che non li avevano.
  if piatti_check_rimosso then
    alter table public.piatti
      add constraint piatti_tipo_valido
      check (tipo is null or tipo in ('antipasti', 'primi', 'secondi', 'contorni'));
  end if;
end $$;

-- ── 3. Via i codici brevi ────────────────────────────────────────────
-- Dopo gli update nessuna riga li referenzia più; da qui in poi il DB
-- rifiuta un tipo scritto con la vecchia grafia.
delete from public.dish_types where code in ('ant', 'pr', 'se', 'con');

-- ============================================================
-- 014 · Ripristino piatti "Sempre a Vostra scelta" (pre-013)
-- Run in Supabase → SQL Editor (as authenticated user / service role)
-- Run AFTER 013_footer_righe_piatti.sql
--
-- La 013 ha svuotato footer_riga perché il vecchio testo libero non era
-- mappabile automaticamente ai piatti del catalogo. Questo script ricrea
-- a catalogo (se mancanti) i piatti che c'erano scritti a mano nelle due
-- righe originali e ripopola footer_riga:
--   riga 1: Pennette al pomodoro Siciliano o al ragù bolognese (pr),
--           Omelette alle erbe dei Colli Euganei (se)
--   riga 2: Petti di pollo, Finissima di manzo,
--           Escaloppe di maiale alla griglia (se)
--
-- NB: vegetariano/vegano/no_lattosio/locale e tutti gli allergeni sono
-- impostati a false (come in 011) perché non erano specificati nel testo
-- originale — vanno verificati ed eventualmente corretti da «Elenco piatti».
--
-- Un solo statement (blocco DO), idempotente: crea solo i piatti che
-- mancano (match su nome_it) e popola footer_riga SOLO se è ancora vuota
-- (non sovrascrive righe già inserite a mano dalla UI dopo la 013).
-- ============================================================

do $$
declare
  v_next_id integer;
  v_pennette_id integer;
  v_omelette_id integer;
  v_petti_id integer;
  v_finissima_id integer;
  v_escaloppe_id integer;
begin
  select coalesce(max(id), 0) into v_next_id from public.piatti;

  select id into v_pennette_id from public.piatti where nome_it = 'Pennette al pomodoro Siciliano o al ragù bolognese' limit 1;
  if v_pennette_id is null then
    v_next_id := v_next_id + 1;
    insert into public.piatti (id, nome_it, nome_en, nome_de, nome_fr, tipo,
      vegetariano, vegano, no_lattosio, locale,
      all_glutine, all_crostacei, all_uova, all_pesce, all_arachidi, all_soia,
      all_latte, all_frutta_guscio, all_sedano, all_senape, all_sesamo,
      all_solfiti, all_lupini, all_molluschi)
    values (v_next_id,
      'Pennette al pomodoro Siciliano o al ragù bolognese',
      'Penne with Sicilian tomato sauce or Bolognese ragù',
      'Penne mit sizilianischer Tomatensauce oder Bolognese',
      'Pennette à la tomate sicilienne ou au ragù bolognaise',
      'pr',
      false, false, false, false,
      false, false, false, false, false, false,
      false, false, false, false, false,
      false, false, false);
    v_pennette_id := v_next_id;
  end if;

  select id into v_omelette_id from public.piatti where nome_it = 'Omelette alle erbe dei Colli Euganei' limit 1;
  if v_omelette_id is null then
    v_next_id := v_next_id + 1;
    insert into public.piatti (id, nome_it, nome_en, nome_de, nome_fr, tipo,
      vegetariano, vegano, no_lattosio, locale,
      all_glutine, all_crostacei, all_uova, all_pesce, all_arachidi, all_soia,
      all_latte, all_frutta_guscio, all_sedano, all_senape, all_sesamo,
      all_solfiti, all_lupini, all_molluschi)
    values (v_next_id,
      'Omelette alle erbe dei Colli Euganei',
      'Herb omelette from the Euganean Hills',
      'Kräuteromelett aus den Euganäischen Hügeln',
      'Omelette aux herbes des Collines Euganéennes',
      'se',
      false, false, false, false,
      false, false, false, false, false, false,
      false, false, false, false, false,
      false, false, false);
    v_omelette_id := v_next_id;
  end if;

  select id into v_petti_id from public.piatti where nome_it = 'Petti di pollo' limit 1;
  if v_petti_id is null then
    v_next_id := v_next_id + 1;
    insert into public.piatti (id, nome_it, nome_en, nome_de, nome_fr, tipo,
      vegetariano, vegano, no_lattosio, locale,
      all_glutine, all_crostacei, all_uova, all_pesce, all_arachidi, all_soia,
      all_latte, all_frutta_guscio, all_sedano, all_senape, all_sesamo,
      all_solfiti, all_lupini, all_molluschi)
    values (v_next_id,
      'Petti di pollo',
      'Chicken breast',
      'Hühnerbrust',
      'Blanc de poulet',
      'se',
      false, false, false, false,
      false, false, false, false, false, false,
      false, false, false, false, false,
      false, false, false);
    v_petti_id := v_next_id;
  end if;

  select id into v_finissima_id from public.piatti where nome_it = 'Finissima di manzo' limit 1;
  if v_finissima_id is null then
    v_next_id := v_next_id + 1;
    insert into public.piatti (id, nome_it, nome_en, nome_de, nome_fr, tipo,
      vegetariano, vegano, no_lattosio, locale,
      all_glutine, all_crostacei, all_uova, all_pesce, all_arachidi, all_soia,
      all_latte, all_frutta_guscio, all_sedano, all_senape, all_sesamo,
      all_solfiti, all_lupini, all_molluschi)
    values (v_next_id,
      'Finissima di manzo',
      'Lean beef',
      'Rinderfilet fein',
      'Filet de bœuf haché',
      'se',
      false, false, false, false,
      false, false, false, false, false, false,
      false, false, false, false, false,
      false, false, false);
    v_finissima_id := v_next_id;
  end if;

  select id into v_escaloppe_id from public.piatti where nome_it = 'Escaloppe di maiale alla griglia' limit 1;
  if v_escaloppe_id is null then
    v_next_id := v_next_id + 1;
    insert into public.piatti (id, nome_it, nome_en, nome_de, nome_fr, tipo,
      vegetariano, vegano, no_lattosio, locale,
      all_glutine, all_crostacei, all_uova, all_pesce, all_arachidi, all_soia,
      all_latte, all_frutta_guscio, all_sedano, all_senape, all_sesamo,
      all_solfiti, all_lupini, all_molluschi)
    values (v_next_id,
      'Escaloppe di maiale alla griglia',
      'Grilled pork escalope',
      'Gegrillte Schweineschnitzel',
      'Escalope de porc grillée',
      'se',
      false, false, false, false,
      false, false, false, false, false, false,
      false, false, false, false, false,
      false, false, false);
    v_escaloppe_id := v_next_id;
  end if;

  if not exists (select 1 from public.footer_riga) then
    insert into public.footer_riga (ordine, piatto_ids) values
      (0, array[v_pennette_id, v_omelette_id]),
      (1, array[v_petti_id, v_finissima_id, v_escaloppe_id]);
  end if;
end;
$$;

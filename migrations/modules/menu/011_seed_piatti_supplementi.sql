-- ============================================================
-- 011 · Seed piatti con supplemento (Entrecôte, Costolette, Filetto)
-- Run in Supabase → SQL Editor (as authenticated user / service role)
-- ============================================================

do $$
declare
  next_id int;
begin
  select coalesce(max(id), 0) into next_id from public.piatti;

  if not exists (select 1 from public.piatti where nome_it = 'Entrecôte di manzo') then
    next_id := next_id + 1;
    insert into public.piatti (id, nome_it, nome_en, nome_de, nome_fr, tipo,
      vegetariano, vegano, no_lattosio, locale,
      all_glutine, all_crostacei, all_uova, all_pesce, all_arachidi, all_soia,
      all_latte, all_frutta_guscio, all_sedano, all_senape, all_sesamo,
      all_solfiti, all_lupini, all_molluschi)
    values (next_id, 'Entrecôte di manzo', 'Beef entrecôte', 'Rinderentrecôte', 'Entrecôte de bœuf', 'se',
      false, false, false, false,
      false, false, false, false, false, false,
      false, false, false, false, false,
      false, false, false);
  end if;

  if not exists (select 1 from public.piatti where nome_it = 'Costolette di agnello') then
    next_id := next_id + 1;
    insert into public.piatti (id, nome_it, nome_en, nome_de, nome_fr, tipo,
      vegetariano, vegano, no_lattosio, locale,
      all_glutine, all_crostacei, all_uova, all_pesce, all_arachidi, all_soia,
      all_latte, all_frutta_guscio, all_sedano, all_senape, all_sesamo,
      all_solfiti, all_lupini, all_molluschi)
    values (next_id, 'Costolette di agnello', 'Lamb chops', 'Lammkoteletts', 'Côtelettes d''agneau', 'se',
      false, false, false, false,
      false, false, false, false, false, false,
      false, false, false, false, false,
      false, false, false);
  end if;

  if not exists (select 1 from public.piatti where nome_it = 'Filetto di manzo') then
    next_id := next_id + 1;
    insert into public.piatti (id, nome_it, nome_en, nome_de, nome_fr, tipo,
      vegetariano, vegano, no_lattosio, locale,
      all_glutine, all_crostacei, all_uova, all_pesce, all_arachidi, all_soia,
      all_latte, all_frutta_guscio, all_sedano, all_senape, all_sesamo,
      all_solfiti, all_lupini, all_molluschi)
    values (next_id, 'Filetto di manzo', 'Beef fillet', 'Rinderfilet', 'Filet de bœuf', 'se',
      false, false, false, false,
      false, false, false, false, false, false,
      false, false, false, false, false,
      false, false, false);
  end if;
end;
$$;

-- ============================================================
-- 024 · Scambio dei ruoli receptionist ↔ cucina
-- Run AFTER 023_quarto_secondo.sql
--
-- Ribalta la divisione dei compiti impostata dalla 016: era la cucina a
-- consultare soltanto, ora è il receptionist.
--
--   receptionist  sola lettura ovunque; stampa il menù clienti e la settimanale
--   cucina        scrive piatti, menù, bisettimane, flag, eventi e footer;
--                 stampa ricette e settimanale
--   admin         tutto
--
-- Rispetto alla 016 cambiano due cose, non una:
--   1. le policy restrictive passano da 'cucina' a 'receptionist'
--   2. entra `piatti`, che prima non era protetta: la libreria era scrivibile
--      da entrambi i ruoli, ora il receptionist non la tocca più
--
-- La SELECT resta libera per tutti: il receptionist deve vedere tutto per
-- poterlo stampare.
--
-- ⚠️ DEPLOY: applicare INSIEME al build. Fra migrazione e pubblicazione il
-- receptionist vede ancora i pulsanti di modifica ma il DB rifiuta le
-- scritture; la cucina vede la UI in sola lettura pur potendo già scrivere.
-- ============================================================

-- ── 1. Via le policy della 016, intestate alla cucina ────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'bisettimane', 'menu_voci', 'menu_flags',
    'eventi', 'footer_riga', 'footer_supplemento'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('drop policy if exists "Cucina sola lettura (insert)" on public.%I', t);
    execute format('drop policy if exists "Cucina sola lettura (update)" on public.%I', t);
    execute format('drop policy if exists "Cucina sola lettura (delete)" on public.%I', t);
  end loop;
end $$;

drop policy if exists "Cucina sola lettura eventi-images (insert)" on storage.objects;
drop policy if exists "Cucina sola lettura eventi-images (update)" on storage.objects;
drop policy if exists "Cucina sola lettura eventi-images (delete)" on storage.objects;

-- ── 2. Le stesse restrizioni, ora sul receptionist ───────────────────
-- Policy RESTRICTIVE: si sommano in AND alle permissive, quindi non
-- ampliano mai gli accessi, li restringono soltanto.
-- `piatti` è in elenco: è la novità rispetto alla 016.
do $$
declare
  t text;
begin
  foreach t in array array[
    'piatti',
    'bisettimane', 'menu_voci', 'menu_flags',
    'eventi', 'footer_riga', 'footer_supplemento'
  ]
  loop
    -- to_regclass: salta le tabelle eventualmente assenti in un DB cliente
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('drop policy if exists "Receptionist sola lettura (insert)" on public.%I', t);
    execute format($f$
      create policy "Receptionist sola lettura (insert)" on public.%I
        as restrictive for insert to authenticated
        with check (public.app_role() <> 'receptionist')
    $f$, t);
    execute format('drop policy if exists "Receptionist sola lettura (update)" on public.%I', t);
    execute format($f$
      create policy "Receptionist sola lettura (update)" on public.%I
        as restrictive for update to authenticated
        using (public.app_role() <> 'receptionist')
    $f$, t);
    execute format('drop policy if exists "Receptionist sola lettura (delete)" on public.%I', t);
    execute format($f$
      create policy "Receptionist sola lettura (delete)" on public.%I
        as restrictive for delete to authenticated
        using (public.app_role() <> 'receptionist')
    $f$, t);
  end loop;
end $$;

-- Storage: le immagini degli eventi le carica chi gestisce gli eventi.
drop policy if exists "Receptionist sola lettura eventi-images (insert)" on storage.objects;
create policy "Receptionist sola lettura eventi-images (insert)" on storage.objects
  as restrictive for insert to authenticated
  with check (bucket_id <> 'eventi-images' or public.app_role() <> 'receptionist');

drop policy if exists "Receptionist sola lettura eventi-images (update)" on storage.objects;
create policy "Receptionist sola lettura eventi-images (update)" on storage.objects
  as restrictive for update to authenticated
  using (bucket_id <> 'eventi-images' or public.app_role() <> 'receptionist');

drop policy if exists "Receptionist sola lettura eventi-images (delete)" on storage.objects;
create policy "Receptionist sola lettura eventi-images (delete)" on storage.objects
  as restrictive for delete to authenticated
  using (bucket_id <> 'eventi-images' or public.app_role() <> 'receptionist');

-- ⚠️ Il default di app_role() per un utente senza riga in user_roles resta
-- 'receptionist' (016). Da oggi quel default è il ruolo MENO capace: un utente
-- senza riga si ritrova in sola lettura anziché con pieni poteri sui menù.
-- È il verso giusto per un default, ma va saputo quando si creano account.

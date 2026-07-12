-- ============================================================
-- 016 · Ruoli utente (receptionist | cucina | admin)
--
-- La riga in user_roles si crea A MANO dalla dashboard Supabase
-- (come la creazione degli utenti). Senza riga il ruolo è
-- 'receptionist': è il comportamento storico dell'app, quindi gli
-- utenti esistenti non cambiano permessi.
--
-- Permessi:
--   receptionist  tutto come oggi (stampa menù clienti)
--   cucina        piatti ok; menù/flag/bisettimane in sola lettura;
--                 eventi e footer in sola lettura (pagine nascoste in UI)
--   admin         tutto (stampa menù clienti + stampa ricette)
-- ============================================================

create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('receptionist', 'cucina', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon;

-- Ogni utente legge solo il proprio ruolo; nessuna scrittura via API
-- (le righe si gestiscono dalla dashboard con il ruolo postgres).
drop policy if exists "Read own role" on public.user_roles;
create policy "Read own role" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid());

-- Ruolo dell'utente corrente, per le policy RLS.
-- SECURITY DEFINER: legge user_roles anche se il chiamante non ha
-- policy su quella tabella (auth.uid() resta quello della richiesta).
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role from public.user_roles where user_id = auth.uid()),
    'receptionist'
  )
$$;

-- ── Difesa in profondità: blocco scritture della cucina lato DB ──────
-- Policy RESTRICTIVE: si sommano in AND alle policy permissive esistenti,
-- quindi non ampliano mai gli accessi, li restringono soltanto.
-- La SELECT resta libera (la cucina deve poter visualizzare i menù).
do $$
declare
  t text;
begin
  foreach t in array array[
    'bisettimane', 'menu_voci', 'menu_flags',
    'eventi', 'footer_riga', 'footer_supplemento'
  ]
  loop
    -- to_regclass: salta le tabelle eventualmente assenti in un DB cliente
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('drop policy if exists "Cucina sola lettura (insert)" on public.%I', t);
    execute format($f$
      create policy "Cucina sola lettura (insert)" on public.%I
        as restrictive for insert to authenticated
        with check (public.app_role() <> 'cucina')
    $f$, t);
    execute format('drop policy if exists "Cucina sola lettura (update)" on public.%I', t);
    execute format($f$
      create policy "Cucina sola lettura (update)" on public.%I
        as restrictive for update to authenticated
        using (public.app_role() <> 'cucina')
    $f$, t);
    execute format('drop policy if exists "Cucina sola lettura (delete)" on public.%I', t);
    execute format($f$
      create policy "Cucina sola lettura (delete)" on public.%I
        as restrictive for delete to authenticated
        using (public.app_role() <> 'cucina')
    $f$, t);
  end loop;
end $$;

-- Storage: la cucina non carica/modifica le immagini degli eventi.
drop policy if exists "Cucina sola lettura eventi-images (insert)" on storage.objects;
create policy "Cucina sola lettura eventi-images (insert)" on storage.objects
  as restrictive for insert to authenticated
  with check (bucket_id <> 'eventi-images' or public.app_role() <> 'cucina');

drop policy if exists "Cucina sola lettura eventi-images (update)" on storage.objects;
create policy "Cucina sola lettura eventi-images (update)" on storage.objects
  as restrictive for update to authenticated
  using (bucket_id <> 'eventi-images' or public.app_role() <> 'cucina');

drop policy if exists "Cucina sola lettura eventi-images (delete)" on storage.objects;
create policy "Cucina sola lettura eventi-images (delete)" on storage.objects
  as restrictive for delete to authenticated
  using (bucket_id <> 'eventi-images' or public.app_role() <> 'cucina');

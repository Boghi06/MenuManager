-- Patch RLS per bisettimane (da eseguire se hai già creato la tabella senza policy)
-- Vai su Supabase → SQL Editor e incolla questo script.

alter table public.bisettimane enable row level security;

create policy "Authenticated read bisettimane"
  on public.bisettimane for select to authenticated using (true);

create policy "Authenticated insert bisettimane"
  on public.bisettimane for insert to authenticated with check (true);

create policy "Authenticated update bisettimane"
  on public.bisettimane for update to authenticated using (true) with check (true);

create policy "Authenticated delete bisettimane"
  on public.bisettimane for delete to authenticated using (true);

grant select on public.bisettimane_with_stato to authenticated;

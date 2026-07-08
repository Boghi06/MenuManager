-- Tabella bisettimane
create table bisettimane (
  id uuid primary key default gen_random_uuid(),
  anno smallint not null,
  mese smallint not null check (mese between 1 and 12),
  bisettimana_idx smallint not null check (bisettimana_idx in (1, 2)),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (anno, mese, bisettimana_idx)
);

-- View con stato compilazione
-- Per ora restituisce sempre 'empty'; la logica verrà aggiornata
-- quando la tabella menu_giorno sarà definita nel prossimo handoff.
create or replace view bisettimane_with_stato as
select
  id,
  anno,
  mese,
  bisettimana_idx,
  created_at,
  updated_at,
  'empty'::text as stato
from bisettimane;

-- Row Level Security (coerente con il resto dello schema)
alter table public.bisettimane enable row level security;

create policy "Authenticated read bisettimane"
  on public.bisettimane for select to authenticated using (true);

create policy "Authenticated insert bisettimane"
  on public.bisettimane for insert to authenticated with check (true);

create policy "Authenticated update bisettimane"
  on public.bisettimane for update to authenticated using (true) with check (true);

create policy "Authenticated delete bisettimane"
  on public.bisettimane for delete to authenticated using (true);

-- Grant esplicito sulla view per utenti autenticati
grant select on public.bisettimane_with_stato to authenticated;

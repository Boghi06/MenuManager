-- ============================================================
-- 005 · Flags per giorno/servizio — "Succhi di frutta" toggle
-- Run AFTER 003_menu_voci.sql
-- ============================================================
-- Ogni giorno × servizio può avere flag opzionali (es. mostra/nascondi succhi).
-- Se la riga non esiste, tutti i flag assumono il valore di default (true per succhi).

create table public.menu_flags (
  bisettimana_id  uuid      not null references public.bisettimane(id) on delete cascade,
  giorno          smallint  not null check (giorno between 0 and 13),
  servizio        text      not null check (servizio in ('pranzo', 'cena')),
  show_succhi     boolean   not null default true,
  primary key (bisettimana_id, giorno, servizio)
);

alter table public.menu_flags enable row level security;

create policy "Authenticated select menu_flags"
  on public.menu_flags for select to authenticated using (true);

create policy "Authenticated insert menu_flags"
  on public.menu_flags for insert to authenticated with check (true);

create policy "Authenticated update menu_flags"
  on public.menu_flags for update to authenticated using (true) with check (true);

create policy "Authenticated delete menu_flags"
  on public.menu_flags for delete to authenticated using (true);

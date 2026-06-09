-- ============================================================
-- 003 · Composizione menù — voci di menù (Opzione A · Settimana × portate)
-- Run AFTER 002_bisettimane.sql
-- ============================================================
-- Una riga = un'alternativa in una cella (bisettimana, giorno, servizio, sezione, posizione).
-- Il CONTORNO è un attributo OPZIONALE del SECONDO: contorno_id (0 o 1 contorno),
-- non una portata/riga a sé.

-- ── 0. Antipasto come tipo piatto ────────────────────────────────────
insert into public.dish_types (code, description) values ('ant', 'Antipasti')
  on conflict (code) do nothing;

-- ── 1. Voci di menù ──────────────────────────────────────────────────
create table public.menu_voci (
  id              bigserial   primary key,
  bisettimana_id  uuid        not null references public.bisettimane(id) on delete cascade,
  giorno          smallint    not null check (giorno between 0 and 13),  -- 0=Lun sett.1 … 13=Dom sett.2
  servizio        text        not null check (servizio in ('pranzo','cena')),
  tipo            text        not null references public.dish_types(code),  -- ant | pr | se | des
  piatto_id       bigint      not null references public.piatti(id) on delete cascade,
  contorno_id     bigint      references public.piatti(id) on delete set null,  -- SOLO secondi; nullable (0 o 1)
  posizione       smallint    not null default 0 check (posizione between 0 and 2),
  created_at      timestamptz not null default now(),
  created_by      uuid        references auth.users(id),
  -- il contorno esiste solo sui secondi
  check (contorno_id is null or tipo = 'se'),
  -- max 3 alternative ordinate per cella
  unique (bisettimana_id, giorno, servizio, tipo, posizione)
);
create index menu_voci_bisettimana_idx on public.menu_voci (bisettimana_id);

-- ── 2. RLS coerente col resto dello schema ───────────────────────────
alter table public.menu_voci enable row level security;
create policy "Authenticated read menu_voci"   on public.menu_voci for select to authenticated using (true);
create policy "Authenticated insert menu_voci" on public.menu_voci for insert to authenticated with check (true);
create policy "Authenticated update menu_voci" on public.menu_voci for update to authenticated using (true) with check (true);
create policy "Authenticated delete menu_voci" on public.menu_voci for delete to authenticated using (true);

-- ── 3. Stato compilazione bisettimana (prima sempre 'empty') ─────────
-- Default: 'full' = ogni sezione (ant,pr,se,des) presente in tutti i 14 giorni × 2 servizi.
-- Il contorno è opzionale → NON entra nel calcolo di 'full'.
-- ⚠️ CONFERMARE la regola col cliente (vedi README · Decisioni di prodotto).
create or replace view public.bisettimane_with_stato as
select
  b.id, b.anno, b.mese, b.bisettimana_idx, b.created_at, b.updated_at,
  case
    when count(v.id) = 0 then 'empty'
    when count(distinct (v.giorno || '-' || v.servizio || '-' || v.tipo)) >= (14 * 2 * 4) then 'full'
    else 'partial'
  end as stato
from public.bisettimane b
left join public.menu_voci v on v.bisettimana_id = b.id
group by b.id;
grant select on public.bisettimane_with_stato to authenticated;

-- ── 4. Audit trigger (allinea menu_voci ad activity_log) ─────────────
-- Riusa la stessa funzione di log dei piatti (security invoker → auth.uid()).
create trigger menu_voci_audit
  after insert or update or delete
  on public.menu_voci
  for each row execute function public.log_piatti_changes();

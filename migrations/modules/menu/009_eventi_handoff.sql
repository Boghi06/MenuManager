-- ============================================================
-- 009 · Eventi handoff — ordinamento + conteggio utilizzi
-- Run AFTER 008_eventi.sql
-- ============================================================

-- ordinamento manuale opzionale sugli eventi
alter table public.eventi add column if not exists ordine smallint not null default 0;

-- timestamp di ultima modifica su menu_flags (per ordinamento "utilizzo recente")
alter table public.menu_flags add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_menu_flags_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_menu_flags_updated_at on public.menu_flags;
create trigger trg_menu_flags_updated_at
  before update on public.menu_flags
  for each row execute function public.set_menu_flags_updated_at();

-- view: eventi con conteggio utilizzi (quante righe menu_flags usano l'evento) e ultimo uso
create or replace view public.eventi_with_usi as
select e.*,
       coalesce(u.usi, 0)::int as usi,
       u.ultimo_uso
from public.eventi e
left join (
  select evento_id, count(*) as usi, max(updated_at) as ultimo_uso
  from public.menu_flags
  where evento_id is not null
  group by evento_id
) u on u.evento_id = e.id;

grant select on public.eventi_with_usi to authenticated, anon;

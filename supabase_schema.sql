-- ============================================================
-- SCHEMA: Hotel Garden Menu Platform
-- Run this in the Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- ── Dish types lookup ────────────────────────────────────────
create table public.dish_types (
  code        text primary key,
  description text not null
);

insert into public.dish_types (code, description) values
  ('ant',   'Antipasti lunch'),
  ('pr',    'Primi piatti'),
  ('vit',   'Vitello'),
  ('mz',    'Manzo – bolliti – grigliate'),
  ('vol',   'Volatili'),
  ('pesce', 'Pesce'),
  ('ma',    'Maiale'),
  ('cont',  'Contorni'),
  ('dol',   'Dolci');

-- ── Main dish table ──────────────────────────────────────────
create table public.piatti (
  id            bigint      primary key,
  nome_it       text        not null,
  nome_en       text,
  nome_fr       text,
  nome_de       text,
  tipo          text        references public.dish_types(code),

  -- Dietary flags
  vegetariano   boolean     not null default false,
  vegano        boolean     not null default false,
  no_lattosio   boolean     not null default false,
  veneziano     boolean     not null default false,

  -- Recipe
  ricetta       text,

  -- 14 EU allergens (Reg. 1169/2011)
  all_glutine         boolean not null default false,
  all_crostacei       boolean not null default false,
  all_uova            boolean not null default false,
  all_pesce           boolean not null default false,
  all_arachidi        boolean not null default false,
  all_soia            boolean not null default false,
  all_latte           boolean not null default false,
  all_frutta_guscio   boolean not null default false,
  all_sedano          boolean not null default false,
  all_senape          boolean not null default false,
  all_sesamo          boolean not null default false,
  all_solfiti         boolean not null default false,
  all_lupini          boolean not null default false,
  all_molluschi       boolean not null default false,

  -- Audit
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid        references auth.users(id),
  updated_by    uuid        references auth.users(id)
);

-- ── Activity log ─────────────────────────────────────────────
create table public.activity_log (
  id          bigserial   primary key,
  user_id     uuid        references auth.users(id),
  user_email  text,
  action      text        not null check (action in ('CREATE', 'UPDATE', 'DELETE')),
  table_name  text        not null,
  record_id   text,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);

-- ── Auto-update updated_at ───────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger piatti_updated_at
  before update on public.piatti
  for each row execute function public.handle_updated_at();

-- ── Row Level Security ───────────────────────────────────────
alter table public.dish_types  enable row level security;
alter table public.piatti      enable row level security;
alter table public.activity_log enable row level security;

-- dish_types: read-only for authenticated users
create policy "Authenticated read dish_types"
  on public.dish_types for select to authenticated using (true);

-- piatti: full CRUD for authenticated users
create policy "Authenticated read piatti"
  on public.piatti for select to authenticated using (true);

create policy "Authenticated insert piatti"
  on public.piatti for insert to authenticated with check (true);

create policy "Authenticated update piatti"
  on public.piatti for update to authenticated using (true) with check (true);

create policy "Authenticated delete piatti"
  on public.piatti for delete to authenticated using (true);

-- activity_log: authenticated users can write and read their own logs
create policy "Authenticated insert logs"
  on public.activity_log for insert to authenticated with check (true);

create policy "Authenticated read logs"
  on public.activity_log for select to authenticated using (true);

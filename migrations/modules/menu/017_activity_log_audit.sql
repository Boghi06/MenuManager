-- ============================================================
-- 017 · Auditing: lettura activity_log per l'admin
-- Run AFTER 016_user_roles.sql (serve public.app_role())
--
-- Storia: activity_log è popolata dai trigger su piatti e menu_voci
-- (log_piatti_changes), ma finora era SOLO scrittura — la 004 ha rimosso
-- la policy di INSERT diretta e non esiste una policy di SELECT, quindi
-- nessuno può leggerla via API. Qui aggiungiamo la lettura per i soli admin.
-- ============================================================

-- Schema canonico (no-op su Hotel Garden, dove la tabella fu creata a mano;
-- utile ai NUOVI clienti senza baseline: senza questa tabella i trigger di
-- log_piatti_changes fallirebbero al primo insert su piatti/menu_voci).
create table if not exists public.activity_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid,
  user_email  text,
  action      text,
  table_name  text,
  record_id   text,
  old_data    jsonb,
  new_data    jsonb
);

alter table public.activity_log enable row level security;
revoke all on public.activity_log from anon;

-- Ordinamento cronologico inverso (la UI mostra i più recenti in cima).
create index if not exists activity_log_created_at_idx
  on public.activity_log (created_at desc);

-- Solo l'admin può leggere l'audit trail. receptionist e cucina restano
-- esclusi (nessuna policy di SELECT che li includa).
drop policy if exists "Admin read activity_log" on public.activity_log;
create policy "Admin read activity_log" on public.activity_log
  for select to authenticated
  using (public.app_role() = 'admin');

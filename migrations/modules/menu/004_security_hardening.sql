-- ============================================================
-- 004 · Security hardening
-- Run AFTER 003_menu_voci.sql (Supabase → SQL Editor)
-- ============================================================

-- ── 1. Audit log a prova di manomissione ─────────────────────────────
-- Prima: la funzione era SECURITY INVOKER e activity_log aveva una policy
-- di INSERT per gli utenti autenticati → chiunque loggato poteva inserire
-- righe arbitrarie (falsificare l'audit trail) via API.
-- Ora: la funzione diventa SECURITY DEFINER (scrive nel log anche senza
-- policy client) e la policy di INSERT diretta viene rimossa.
-- auth.uid() / auth.email() continuano a risolvere l'utente corrente
-- perché leggono i claim JWT della richiesta, non il ruolo di esecuzione.
create or replace function public.log_piatti_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_log
    (user_id, user_email, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(),
    auth.email(),
    case tg_op when 'INSERT' then 'CREATE' else tg_op end,
    tg_table_name,
    case when tg_op = 'DELETE' then old.id::text else new.id::text end,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

drop policy if exists "Authenticated insert logs" on public.activity_log;

-- ── 2. search_path fissato sulle funzioni trigger ────────────────────
-- Evita che uno schema malevolo nel search_path dirotti le chiamate
-- (Supabase linter: function_search_path_mutable).
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 3. View con i permessi del chiamante, non del proprietario ───────
-- Le view di default girano come il proprietario (postgres) e quindi
-- bypassano la RLS delle tabelle sottostanti. Con security_invoker la
-- view rispetta le policy dell'utente che la interroga.
alter view public.bisettimane_with_stato set (security_invoker = true);

-- ── 4. Difesa in profondità: revoca i grant al ruolo anon ────────────
-- La RLS già blocca anon (nessuna policy lo include), ma revocare anche
-- i privilegi di base elimina ogni esposizione in caso di policy future
-- scritte male o RLS disattivata per errore.
revoke all on public.dish_types, public.piatti, public.activity_log from anon;
revoke all on public.bisettimane, public.menu_voci from anon;
revoke all on public.bisettimane_with_stato from anon;

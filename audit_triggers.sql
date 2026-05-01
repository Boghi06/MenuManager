-- ============================================================
-- AUDIT TRIGGERS: Hotel Garden Menu Platform
-- Run this AFTER supabase_schema.sql
-- ============================================================
-- These triggers automatically log every INSERT / UPDATE / DELETE
-- on the piatti table to activity_log, capturing who did it and when.

create or replace function public.log_piatti_changes()
returns trigger
language plpgsql
security invoker  -- runs as the authenticated user, so auth.uid() resolves correctly
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

-- Attach to piatti table (fires after each row change)
create trigger piatti_audit
  after insert or update or delete
  on public.piatti
  for each row execute function public.log_piatti_changes();

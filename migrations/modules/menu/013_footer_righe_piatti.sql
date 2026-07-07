-- ============================================================
-- 013 · Righe "Sempre a Vostra scelta" come piatti dal catalogo
-- Run in Supabase → SQL Editor (as authenticated user / service role)
-- Run AFTER 012_footer_unificato.sql
--
-- footer_riga passa da (ordine, testo_it/en/de/fr scritto a mano) a
-- (ordine, piatto_ids[]) — ogni riga stampata è un gruppo di piatti presi
-- dall'elenco piatti, tradotti automaticamente come già avviene per
-- footer_supplemento. Il testo libero precedente non è mappabile in modo
-- affidabile ai piatti del catalogo: le righe esistenti vengono svuotate
-- (stesso numero di righe, da ripopolare dalla UI scegliendo i piatti).
--
-- Un solo statement (blocco DO), idempotente: se footer_riga è già nel
-- nuovo formato lo salta.
-- ============================================================

do $$
declare
  v_da_migrare boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'footer_riga' and column_name = 'testo_it'
  ) into v_da_migrare;

  if v_da_migrare then
    drop table if exists public.footer_riga_new;

    create table public.footer_riga_new (
      id         uuid primary key default gen_random_uuid(),
      ordine     smallint not null default 0,
      piatto_ids integer[] not null default '{}'::integer[]
    );

    insert into public.footer_riga_new (ordine, piatto_ids)
    select ordine, '{}'::integer[] from public.footer_riga order by ordine;

    drop table public.footer_riga;
    alter table public.footer_riga_new rename to footer_riga;

    alter table public.footer_riga enable row level security;
    create policy "auth_all_footer_riga" on public.footer_riga
      for all to authenticated using (true) with check (true);
  else
    raise notice 'footer_riga già nel nuovo formato (piatto_ids): salto.';
  end if;
end;
$$;

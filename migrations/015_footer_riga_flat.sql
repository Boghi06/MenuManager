-- ============================================================
-- 015 · "Sempre a Vostra scelta" come lista piatta di piatti
-- Run in Supabase → SQL Editor (as authenticated user / service role)
-- Run AFTER 012_footer_unificato.sql (013 e 014 sono superate da questa)
--
-- Niente più "righe" da organizzare a mano: footer_riga diventa una lista
-- piatta (ordine, piatto_id) — un piatto per riga di tabella, una sola
-- voce per piatto. L'impaginazione su più righe stampate (quanti piatti
-- per riga) la decide l'app in automatico in base alla lunghezza del
-- testo, non l'utente.
--
-- Un solo statement (blocco DO), idempotente e a prova di qualsiasi stato
-- precedente:
--   · se footer_riga ha ancora "testo_it" (mai passata per la 013): il
--     testo libero non è mappabile ai piatti, footer_riga parte vuota.
--   · se footer_riga ha "piatto_ids" (formato a gruppi della 013/014):
--     appiattisce ogni array nell'ordine originale.
--   · se è già nel formato piatto_id singolo: non fa nulla.
-- ============================================================

do $$
declare
  v_has_testo boolean;
  v_has_array boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'footer_riga' and column_name = 'testo_it'
  ) into v_has_testo;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'footer_riga' and column_name = 'piatto_ids'
  ) into v_has_array;

  if v_has_testo or v_has_array then
    drop table if exists public.footer_riga_new;

    create table public.footer_riga_new (
      id        uuid primary key default gen_random_uuid(),
      ordine    smallint not null default 0,
      piatto_id integer not null references public.piatti(id) on delete cascade
    );

    if v_has_array then
      insert into public.footer_riga_new (ordine, piatto_id)
      select row_number() over (order by r.ordine, u.ord) - 1, u.piatto_id
      from public.footer_riga r
      cross join lateral unnest(r.piatto_ids) with ordinality as u(piatto_id, ord);
    end if;

    drop table public.footer_riga;
    alter table public.footer_riga_new rename to footer_riga;

    alter table public.footer_riga enable row level security;
    create policy "auth_all_footer_riga" on public.footer_riga
      for all to authenticated using (true) with check (true);
  else
    raise notice 'footer_riga già nel nuovo formato flat (piatto_id): salto.';
  end if;
end;
$$;

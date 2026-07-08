-- ============================================================
-- 012 · Footer unificato — niente più "lingua" come dimensione
-- Run in Supabase → SQL Editor (as authenticated user / service role)
-- Run AFTER 010_footer_strutturato.sql and 011_seed_piatti_supplementi.sql
--
-- Tutto lo script è UN SOLO statement (un blocco DO): selezioni l'intero
-- testo e lo lanci una volta. Ogni sezione (footer_riga, footer_supplemento)
-- controlla da sola se è già nel formato nuovo (colonna "lingua" assente)
-- e in quel caso la salta — quindi è sicuro rilanciarlo più volte anche se
-- un tentativo precedente si è fermato a metà.
-- ============================================================
-- Il footer è lo stesso contenuto tradotto in 4 lingue, non 4 footer
-- indipendenti:
--   · footer_riga: una riga per posizione, con le 4 traduzioni insieme
--     (testo_it/en/de/fr) invece di 4 righe separate per lingua.
--   · footer_supplemento: un piatto (riferimento a public.piatti, non
--     più testo libero) + un prezzo condivisi in tutte le lingue — il
--     nome tradotto si legge da piatti.nome_<lingua> al momento della
--     stampa.

do $$
declare
  rec record;
  v_piatto_id integer;
  v_next_id integer;
  v_riga_da_migrare boolean;
  v_suppl_da_migrare boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'footer_riga' and column_name = 'lingua'
  ) into v_riga_da_migrare;

  if v_riga_da_migrare then
    -- ── footer_riga: da (lingua, ordine, testo) a (ordine, testo_it/en/de/fr) ──

    drop table if exists public.footer_riga_new;

    create table public.footer_riga_new (
      id       uuid primary key default gen_random_uuid(),
      ordine   smallint not null default 0,
      testo_it text not null default '',
      testo_en text not null default '',
      testo_de text not null default '',
      testo_fr text not null default ''
    );

    insert into public.footer_riga_new (ordine, testo_it, testo_en, testo_de, testo_fr)
    select
      ordine,
      coalesce(max(case when lingua = 'it' then testo end), ''),
      coalesce(max(case when lingua = 'en' then testo end), ''),
      coalesce(max(case when lingua = 'de' then testo end), ''),
      coalesce(max(case when lingua = 'fr' then testo end), '')
    from public.footer_riga
    group by ordine
    order by ordine;

    drop table public.footer_riga;
    alter table public.footer_riga_new rename to footer_riga;

    alter table public.footer_riga enable row level security;
    create policy "auth_all_footer_riga" on public.footer_riga
      for all to authenticated using (true) with check (true);
  else
    raise notice 'footer_riga già nel nuovo formato: salto.';
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'footer_supplemento' and column_name = 'lingua'
  ) into v_suppl_da_migrare;

  if v_suppl_da_migrare then
    -- ── footer_supplemento: da (lingua, ordine, piatto testo, prezzo) a (ordine, piatto_id, prezzo) ──

    drop table if exists public.footer_supplemento_new;

    create table public.footer_supplemento_new (
      id        uuid primary key default gen_random_uuid(),
      ordine    smallint not null default 0,
      piatto_id integer not null references public.piatti(id) on delete cascade,
      prezzo    numeric(6,2) not null default 0
    );

    select coalesce(max(id), 0) into v_next_id from public.piatti;

    for rec in
      select
        ordine,
        coalesce(max(case when lingua = 'it' then piatto end), max(piatto)) as nome,
        coalesce(max(case when lingua = 'it' then prezzo end), max(prezzo)) as prezzo
      from public.footer_supplemento
      group by ordine
      order by ordine
    loop
      if rec.nome is null or btrim(rec.nome) = '' then
        continue;
      end if;

      select id into v_piatto_id from public.piatti where nome_it = rec.nome limit 1;

      -- piatto non a catalogo: lo creiamo (solo nome_it) così non si perde il dato
      if v_piatto_id is null then
        v_next_id := v_next_id + 1;
        insert into public.piatti (id, nome_it, tipo,
          vegetariano, vegano, no_lattosio, locale,
          all_glutine, all_crostacei, all_uova, all_pesce, all_arachidi, all_soia,
          all_latte, all_frutta_guscio, all_sedano, all_senape, all_sesamo,
          all_solfiti, all_lupini, all_molluschi)
        values (v_next_id, rec.nome, 'se',
          false, false, false, false,
          false, false, false, false, false, false,
          false, false, false, false, false,
          false, false, false);
        v_piatto_id := v_next_id;
      end if;

      insert into public.footer_supplemento_new (ordine, piatto_id, prezzo)
      values (rec.ordine, v_piatto_id, coalesce(rec.prezzo, 0));
    end loop;

    drop table public.footer_supplemento;
    alter table public.footer_supplemento_new rename to footer_supplemento;

    alter table public.footer_supplemento enable row level security;
    create policy "auth_all_footer_suppl" on public.footer_supplemento
      for all to authenticated using (true) with check (true);
  else
    raise notice 'footer_supplemento già nel nuovo formato: salto.';
  end if;
end;
$$;

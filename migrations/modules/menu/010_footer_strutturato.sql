-- ============================================================
-- 010 · Footer strutturato — righe dinamiche + supplementi {nome, prezzo}
-- Run AFTER 007_evento_footer.sql
-- ============================================================
-- Sostituisce le colonne posizionali r1 / r2 / suppl di footer_config.

create table if not exists public.footer_riga (
  id      uuid primary key default gen_random_uuid(),
  lingua  text not null,
  ordine  smallint not null default 0,
  testo   text not null default ''
);

create table if not exists public.footer_supplemento (
  id      uuid primary key default gen_random_uuid(),
  lingua  text not null,
  ordine  smallint not null default 0,
  piatto  text not null default '',
  prezzo  numeric(6,2) not null default 0
);

alter table public.footer_riga        enable row level security;
alter table public.footer_supplemento enable row level security;

create policy "auth_all_footer_riga"  on public.footer_riga
  for all to authenticated using (true) with check (true);
create policy "auth_all_footer_suppl" on public.footer_supplemento
  for all to authenticated using (true) with check (true);

-- migrazione dati: r1/r2 -> due righe footer_riga per lingua
insert into public.footer_riga (lingua, ordine, testo)
select lingua, 0, r1 from public.footer_config where coalesce(r1, '') <> ''
union all
select lingua, 1, r2 from public.footer_config where coalesce(r2, '') <> '';

-- NB: il campo footer_config.suppl (stringa libera) va spezzato manualmente in
--     righe footer_supplemento {piatto, prezzo} una tantum (non parsabile in
--     modo affidabile). footer_config resta finché StampaPreview legge dal
--     nuovo modello, poi va deprecata.

-- ============================================================
-- 025 · Il limite di 55 caratteri su nome_it non vale per l'archivio
-- Run AFTER 024_scambio_ruoli.sql
--
-- `piatti_nome_it_max_length` (CHECK char_length(nome_it) <= 55) era stato
-- aggiunto a mano nella dashboard di Hotel Garden e non esisteva in nessuna
-- migrazione: questo file lo rende esplicito e lo rimuove.
--
-- Perché va tolto: il catalogo della cucina (File Excel/ElencoPiatti.xls,
-- 4.837 piatti) ne ha 593 che superano i 55 caratteri — nomi veri, non
-- errori: "Funghi pioppini marinati con fiocco di prosciutto crudo e piccolo
-- vol-au-vent alla fonduta di funghi" sono 100 caratteri. Con il vincolo
-- attivo l'import dell'archivio è impossibile senza troncare i nomi, cioè
-- senza falsare il menù.
--
-- Il limite resta dove serve davvero: `TITLE_MAX_LENGTH = 55` in
-- constants/piatti.ts vincola il form, quindi i piatti creati dall'app
-- continuano a stare in una riga di stampa. L'archivio storico no, e va bene:
-- è stato misurato.
--
-- Misura dell'impatto sulla stampa (Chrome headless, geometria reale dei
-- componenti, area utile A4 orizzontale 733px con margine 8mm):
--   · menù ospiti (StampaPreview, colonne 481px): max 2 righe per piatto,
--     nessun rischio di impaginazione
--   · foglio settimanale cucina (StampaSettimana, colonne 122px): i nomi
--     occupano 1-5 righe. Su 2.000 settimane estratte a caso dal catalogo
--     reale: 0 sfori (mediana 603px, p99 659px, max 694px)
--   · lo sforo comincia oltre il ~25% di nomi lunghi nello stesso foglio;
--     l'archivio sta al 12% (593 su 4.846)
--
-- Se in futuro servisse piu margine, StampaSettimana ha gia il flag `piccola`
-- su CellaVoce (font 8px invece di 9.5): oggi e usato solo per i contorni,
-- estenderlo ai nomi lunghi toglie una riga ai casi peggiori.
-- ============================================================

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
     where conrelid = 'public.piatti'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%char_length(nome_it)%'
  loop
    execute format('alter table public.piatti drop constraint %I', r.conname);
    raise notice 'rimosso il vincolo %', r.conname;
  end loop;
end $$;

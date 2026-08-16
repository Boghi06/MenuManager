-- ============================================================
-- 019 · Rimozione della categoria "dessert"
-- Run AFTER 003_menu_voci.sql
--
-- Decisione di prodotto: a fine pasto c'è SEMPRE e solo il "Buffet di
-- dessert", che nel menù è già un flag per giorno/servizio
-- (menu_flags.show_buffet_dessert, migrazione 006) e non un piatto.
-- Il dessert sparisce quindi sia come sezione del menù sia come tipo di
-- piatto: la UI non lo propone più (SEZIONI_ORDER, CATEGORIE, form piatto).
--
-- ⚠️ MIGRAZIONE DISTRUTTIVA: cancella dati. Le righe eliminate finiscono
-- comunque in activity_log (trigger su menu_voci e piatti), quindi restano
-- consultabili dal Registro attività. Fare un backup del DB prima di
-- applicarla su un cliente in produzione.
-- ============================================================

-- ── 1. Voci di menù di tipo dessert ──────────────────────────────────
-- Prima delle piatti: qui il vincolo è sul tipo della voce, non sul piatto
-- (una voce 'des' esiste solo per i dessert, ma essere espliciti tiene il
-- log dell'audit leggibile riga per riga).
delete from public.menu_voci where tipo = 'des';

-- ── 2. Piatti di tipo dessert ────────────────────────────────────────
-- piatti.tipo contiene i codici brevi (ant | pr | se | con | des), non le
-- parole intere: la conversione label→codice avviene nel client (usePiatti).
delete from public.piatti where tipo = 'des';

-- ── 3. Il tipo non è più selezionabile ───────────────────────────────
-- menu_voci.tipo ha una FK su dish_types(code): senza la riga 'des' il DB
-- rifiuta a priori nuove voci dessert, anche se arrivassero da un client
-- non aggiornato (difesa in profondità, come per le policy della cucina).
delete from public.dish_types where code = 'des';

-- ── 4. Stato di compilazione: le sezioni ora sono 3 ──────────────────
-- La vista marcava 'full' una bisettimana con 14 giorni × 2 servizi × 4
-- sezioni (ant, pr, se, des). Senza dessert il totale è 14 × 2 × 3: senza
-- questa modifica nessuna bisettimana risulterebbe più completa.
create or replace view public.bisettimane_with_stato as
select
  b.id, b.anno, b.mese, b.bisettimana_idx, b.created_at, b.updated_at,
  case
    when count(v.id) = 0 then 'empty'
    when count(distinct (v.giorno || '-' || v.servizio || '-' || v.tipo)) >= (14 * 2 * 3) then 'full'
    else 'partial'
  end as stato
from public.bisettimane b
left join public.menu_voci v on v.bisettimana_id = b.id
group by b.id;

-- create or replace non garantisce di preservare le opzioni della vista:
-- ripristiniamo security_invoker (impostato dalla 004) e i grant.
alter view public.bisettimane_with_stato set (security_invoker = true);
grant select on public.bisettimane_with_stato to authenticated;
revoke all on public.bisettimane_with_stato from anon;

-- Performance indexes: filtri più frequenti nelle query dell'applicazione.
-- Questi indici riducono le query da full-table-scan a O(log n).

-- menu_voci: filtrato per bisettimana_id in ogni apertura compositore
CREATE INDEX IF NOT EXISTS idx_menu_voci_bisettimana
  ON public.menu_voci(bisettimana_id, posizione);

-- menu_flags: filtrato per bisettimana_id in ogni apertura compositore
CREATE INDEX IF NOT EXISTS idx_menu_flags_bisettimana
  ON public.menu_flags(bisettimana_id);

-- bisettimane: lookup anno/mese/idx usato in ogni navigazione e duplica
CREATE INDEX IF NOT EXISTS idx_bisettimane_lookup
  ON public.bisettimane(anno, mese, bisettimana_idx);

-- bisettimane: GROUP BY anno per la lista anni nel planner
CREATE INDEX IF NOT EXISTS idx_bisettimane_anno
  ON public.bisettimane(anno);

-- footer_riga: filtrato per lingua ad ogni apertura StampaPreview e Impostazioni
CREATE INDEX IF NOT EXISTS idx_footer_riga_lingua
  ON public.footer_riga(lingua, ordine);

-- footer_supplemento: stesso pattern
CREATE INDEX IF NOT EXISTS idx_footer_supplemento_lingua
  ON public.footer_supplemento(lingua, ordine);

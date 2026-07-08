-- Add optional free-text evento to menu_flags (per day/service)
ALTER TABLE public.menu_flags
  ADD COLUMN IF NOT EXISTS evento text;

-- ---------------------------------------------------------------------------
-- footer_config: editable footer texts per language
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.footer_config (
  lingua  text PRIMARY KEY,
  r1      text NOT NULL DEFAULT '',
  r2      text NOT NULL DEFAULT '',
  suppl   text NOT NULL DEFAULT ''
);

ALTER TABLE public.footer_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_footer_config" ON public.footer_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_all_footer_config" ON public.footer_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.footer_config (lingua, r1, r2, suppl) VALUES
  ('it',
   'Pennette al pomodoro Siciliano o al ragù bolognese, Omelette alle erbe dei Colli Euganei',
   'Petti di pollo,  Finissima di manzo,  Escaloppe di maiale alla griglia',
   'Con supplemento:  Entrecôte di manzo € 7,00  –  Costolette di agnello € 7,00  –  Filetto di manzo € 10,00'),
  ('en',
   'Penne with Sicilian tomato sauce or Bolognese ragù, Herb omelette from the Euganean Hills',
   'Chicken breast,  Lean beef,  Grilled pork escalope',
   'With supplement:  Beef entrecôte € 7.00  –  Lamb chops € 7.00  –  Beef fillet € 10.00'),
  ('de',
   'Penne mit sizilianischer Tomatensauce oder Bolognese, Kräuteromelett aus den Euganäischen Hügeln',
   'Hühnerbrust,  Rinderfilet fein,  Gegrillte Schweineeschnitzel',
   'Mit Aufpreis:  Rinderentrecôte € 7,00  –  Lammkoteletts € 7,00  –  Rinderfilet € 10,00'),
  ('fr',
   'Pennette à la tomate sicilienne ou au ragù bolognaise, Omelette aux herbes des Collines Euganéennes',
   'Blanc de poulet,  Filet de bœuf haché,  Escalope de porc grillée',
   E'Avec supplément :  Entrecôte de bœuf € 7,00  –  Côtelettes d\'agneau € 7,00  –  Filet de bœuf € 10,00')
ON CONFLICT (lingua) DO NOTHING;

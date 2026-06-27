-- ---------------------------------------------------------------------------
-- eventi: named reusable events (title + image + subtitle)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.eventi (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  sottotitolo  text,
  immagine_url text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.eventi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_eventi" ON public.eventi
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_all_eventi" ON public.eventi
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for event images (public read)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('eventi-images', 'eventi-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_upload_eventi_images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_upload_eventi_images" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'eventi-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_eventi_images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "public_read_eventi_images" ON storage.objects
      FOR SELECT USING (bucket_id = 'eventi-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_delete_eventi_images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "auth_delete_eventi_images" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'eventi-images');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- menu_flags: replace free-text "evento" with FK to eventi
-- ---------------------------------------------------------------------------

ALTER TABLE public.menu_flags
  DROP COLUMN IF EXISTS evento;

ALTER TABLE public.menu_flags
  ADD COLUMN IF NOT EXISTS evento_id uuid REFERENCES public.eventi(id) ON DELETE SET NULL;

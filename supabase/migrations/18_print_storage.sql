-- Personalization (print-on-demand) storage buckets.
-- Lives after 05_is_admin.sql because policies reference public.is_admin().

-- Public: admin-managed mockups and masks.
INSERT INTO storage.buckets (id, name, public)
VALUES ('print-templates', 'print-templates', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_print_templates" ON storage.objects;
CREATE POLICY "public_read_print_templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'print-templates');

DROP POLICY IF EXISTS "admin_write_print_templates" ON storage.objects;
CREATE POLICY "admin_write_print_templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'print-templates' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_delete_print_templates" ON storage.objects;
CREATE POLICY "admin_delete_print_templates"
ON storage.objects FOR DELETE
USING (bucket_id = 'print-templates' AND public.is_admin(auth.uid()));

-- Private: user-uploaded source images for customizations.
INSERT INTO storage.buckets (id, name, public)
VALUES ('customizations-source', 'customizations-source', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authed_read_customizations_source" ON storage.objects;
CREATE POLICY "authed_read_customizations_source"
ON storage.objects FOR SELECT
USING (bucket_id = 'customizations-source' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "authed_write_customizations_source" ON storage.objects;
CREATE POLICY "authed_write_customizations_source"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'customizations-source' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "authed_delete_customizations_source" ON storage.objects;
CREATE POLICY "authed_delete_customizations_source"
ON storage.objects FOR DELETE
USING (bucket_id = 'customizations-source' AND auth.uid() IS NOT NULL);

-- Private: client-rendered previews.
INSERT INTO storage.buckets (id, name, public)
VALUES ('customizations-preview', 'customizations-preview', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authed_read_customizations_preview" ON storage.objects;
CREATE POLICY "authed_read_customizations_preview"
ON storage.objects FOR SELECT
USING (bucket_id = 'customizations-preview' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "authed_write_customizations_preview" ON storage.objects;
CREATE POLICY "authed_write_customizations_preview"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'customizations-preview' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "authed_delete_customizations_preview" ON storage.objects;
CREATE POLICY "authed_delete_customizations_preview"
ON storage.objects FOR DELETE
USING (bucket_id = 'customizations-preview' AND auth.uid() IS NOT NULL);

-- Private: server-rendered print files. Service role writes; admins read.
INSERT INTO storage.buckets (id, name, public)
VALUES ('customizations-print', 'customizations-print', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "admin_read_customizations_print" ON storage.objects;
CREATE POLICY "admin_read_customizations_print"
ON storage.objects FOR SELECT
USING (bucket_id = 'customizations-print' AND public.is_admin(auth.uid()));

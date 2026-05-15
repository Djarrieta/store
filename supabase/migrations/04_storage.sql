INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "public_read_item_images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY IF NOT EXISTS "allow_upload_item_images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'item-images' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "allow_delete_item_images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'item-images' AND auth.uid() IS NOT NULL);

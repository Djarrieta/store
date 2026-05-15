INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_item_images" ON storage.objects;
CREATE POLICY "public_read_item_images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'item-images');

DROP POLICY IF EXISTS "allow_upload_item_images" ON storage.objects;
CREATE POLICY "allow_upload_item_images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'item-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "allow_delete_item_images" ON storage.objects;
CREATE POLICY "allow_delete_item_images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'item-images' AND auth.uid() IS NOT NULL);

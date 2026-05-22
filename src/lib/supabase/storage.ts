import { createClient } from "@/lib/supabase/client";

export async function uploadImage(file: File, bucket: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a file to a bucket and return both the object path (for DB storage)
 * and the public URL (for immediate preview). Use this when the schema stores
 * the object path rather than the URL.
 */
export async function uploadStorageObject(
  file: File,
  bucket: string,
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

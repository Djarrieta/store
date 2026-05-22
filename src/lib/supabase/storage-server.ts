import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Create a short-lived signed URL for an object in a private bucket.
 * Server-only — kept out of `storage.ts` so the client bundle never pulls
 * in `next/headers`.
 */
export async function signStoragePath(
  bucket: string,
  path: string,
  expiresIn = 60 * 60,
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

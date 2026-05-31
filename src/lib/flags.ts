import { createClient } from "@/lib/supabase/server";

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("key", key)
    .single();
  return data?.enabled ?? false;
}

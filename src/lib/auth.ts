import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function ensureProfile(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: (user.user_metadata?.full_name ??
        user.user_metadata?.display_name ??
        user.email?.split("@")[0] ??
        "") as string,
      avatar_url: (user.user_metadata?.avatar_url ?? null) as string | null,
    },
    { onConflict: "id" },
  );
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user);
  return user;
}

export async function isAdmin(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  return data?.is_admin ?? false;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!(await isAdmin(user.id))) redirect("/");
  return user;
}

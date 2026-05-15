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

export function isAdmin(userId?: string | null) {
  if (!userId) return false;
  const admins = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return admins.includes(userId);
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!isAdmin(user.id)) redirect("/items");
  return user;
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function updateContent(key: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const value = ((formData.get("value") as string) ?? "").trim();

  const { error } = await supabase
    .from("content")
    .update({ value })
    .eq("key", key);

  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

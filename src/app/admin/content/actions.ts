"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createContent(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const key = ((formData.get("key") as string) ?? "").trim();
  const value = ((formData.get("value") as string) ?? "").trim();
  const pinned = formData.get("pinned") === "on";

  const { error } = await supabase.from("content").insert({ key, value, pinned });
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function updateContent(key: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const value = ((formData.get("value") as string) ?? "").trim();
  const pinned = formData.get("pinned") === "on";

  const { error } = await supabase
    .from("content")
    .update({ value, pinned })
    .eq("key", key);

  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function deleteContent(key: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("content").delete().eq("key", key);
  if (error) throw new Error(error.message);

  revalidatePath("/about");
  revalidatePath("/admin/content");
}

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

export async function updateHero(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const title = ((formData.get("title") as string) ?? "").trim();
  const subtitle = ((formData.get("subtitle") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const ctaLabel = ((formData.get("cta_label") as string) ?? "").trim();
  const ctaHref = ((formData.get("cta_href") as string) ?? "").trim();

  let images: { url: string }[] = [];
  const rawImages = (formData.get("images") as string) ?? "[]";
  try {
    const parsed = JSON.parse(rawImages) as unknown;
    if (Array.isArray(parsed)) {
      images = parsed
        .map((img) =>
          img && typeof (img as { url?: unknown }).url === "string"
            ? { url: (img as { url: string }).url }
            : null,
        )
        .filter((img): img is { url: string } => img !== null);
    }
  } catch {
    images = [];
  }

  const value = JSON.stringify({
    title,
    subtitle,
    description,
    cta_label: ctaLabel,
    cta_href: ctaHref,
    images,
  });

  const { error } = await supabase
    .from("content")
    .upsert({ key: "home_hero", value, pinned: true }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

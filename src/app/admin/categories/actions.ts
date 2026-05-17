"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/types";

function parseInput(formData: FormData): CreateCategoryInput {
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string | null)?.trim() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const parent_id = (formData.get("parent_id") as string | null)?.trim() || null;

  return { name, slug, parent_id: parent_id || null };
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const input = parseInput(formData);

  const { error } = await supabase.from("categories").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const input: UpdateCategoryInput = parseInput(formData);

  const { error } = await supabase.from("categories").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/categories");
}

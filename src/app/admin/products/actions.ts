"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { CreateProductInput, UpdateProductInput } from "@/types";

function parseTags(raw: string | null) {
  return (raw ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function parseImages(raw: string | null) {
  try {
    return JSON.parse(raw ?? "[]");
  } catch {
    return [];
  }
}

function parseInput(formData: FormData): CreateProductInput {
  const category_id =
    (formData.get("category_id") as string | null)?.trim() || null;

  return {
    title: (formData.get("title") as string).trim().slice(0, MAX_TITLE_LENGTH),
    description:
      (formData.get("description") as string | null)
        ?.trim()
        .slice(0, MAX_DESCRIPTION_LENGTH) || null,
    price: Number(formData.get("price") as string) || 0,
    discount: Math.min(100, Math.max(0, Number(formData.get("discount") as string) || 0)),
    images: parseImages(formData.get("images") as string | null),
    tags: parseTags(formData.get("tags") as string | null),
    category_id: category_id || null,
  };
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const input = parseInput(formData);

  const { data: product, error } = await supabase.from("products").insert(input).select("id").single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}/edit`);
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const input: UpdateProductInput = parseInput(formData);

  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath(`/products/${id}`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/products");
}

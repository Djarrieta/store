"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { CreateItemInput, UpdateItemInput } from "@/types";

function parseInput(formData: FormData): CreateItemInput {
  const sku = (formData.get("sku") as string | null)?.trim() || null;
  return {
    product_id: (formData.get("product_id") as string).trim(),
    sku: sku || null,
    stock: Math.max(0, parseInt((formData.get("stock") as string) ?? "0", 10) || 0),
  };
}

export async function createItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const input = parseInput(formData);

  const { error } = await supabase.from("items").insert(input);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/items");
  redirect("/admin/items");
}

export async function updateItem(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const input: UpdateItemInput = parseInput(formData);

  const { error } = await supabase.from("items").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/items");
  redirect("/admin/items");
}

export async function deleteItem(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/items");
}

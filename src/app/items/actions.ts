"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/lib/constants";
import { requireAdmin, requireAuth } from "@/lib/auth";
import type { CreateItemInput, UpdateItemInput } from "@/types";

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

function parseInput(formData: FormData): CreateItemInput {
  return {
    title: (formData.get("title") as string).trim().slice(0, MAX_TITLE_LENGTH),
    description:
      (formData.get("description") as string | null)
        ?.trim()
        .slice(0, MAX_DESCRIPTION_LENGTH) || null,
    images: parseImages(formData.get("images") as string | null),
    tags: parseTags(formData.get("tags") as string | null),
    price: Number(formData.get("price") as string) || 0,
    category: ((formData.get("category") as string | null) ?? "").trim(),
  };
}

export async function createItem(formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const input = parseInput(formData);

  const { error } = await supabase.from("items").insert(input);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/items");
  redirect("/items");
}

export async function updateItem(id: string, formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const input: UpdateItemInput = parseInput(formData);

  const { error } = await supabase
    .from("items")
    .update(input)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

export async function deleteItem(id: string) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/items");
  redirect("/items");
}

export async function deleteItems(ids: string[]) {
  await requireAuth();
  if (ids.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().in("id", ids);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/items");
}

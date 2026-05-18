"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const product_id = (formData.get("product_id") as string).trim();
  const stock = Math.max(0, parseInt((formData.get("stock") as string) ?? "0", 10) || 0);
  const categoryIds = (formData.getAll("category_ids") as string[]).filter(Boolean);

  const { data: item, error } = await supabase
    .from("items")
    .insert({ product_id, stock })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (categoryIds.length > 0) {
    const { error: icError } = await supabase
      .from("item_categories")
      .insert(categoryIds.map((category_id) => ({ item_id: item.id, category_id })));
    if (icError) throw new Error(icError.message);
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function createItemForProduct(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const stock = Math.max(0, parseInt((formData.get("stock") as string) ?? "0", 10) || 0);
  const categoryIds = (formData.getAll("category_ids") as string[]).filter(Boolean);

  const { data: item, error } = await supabase
    .from("items")
    .insert({ product_id: productId, stock })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (categoryIds.length > 0) {
    const { error: icError } = await supabase
      .from("item_categories")
      .insert(categoryIds.map((category_id) => ({ item_id: item.id, category_id })));
    if (icError) throw new Error(icError.message);
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  redirect(`/admin/products/${productId}/edit`);
}

export async function updateItem(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const stock = Math.max(0, parseInt((formData.get("stock") as string) ?? "0", 10) || 0);
  const categoryIds = (formData.getAll("category_ids") as string[]).filter(Boolean);

  const { data: item, error } = await supabase
    .from("items")
    .update({ stock })
    .eq("id", id)
    .select("product_id")
    .single();
  if (error) throw new Error(error.message);

  // Replace all categories
  const { error: delError } = await supabase
    .from("item_categories")
    .delete()
    .eq("item_id", id);
  if (delError) throw new Error(delError.message);

  if (categoryIds.length > 0) {
    const { error: icError } = await supabase
      .from("item_categories")
      .insert(categoryIds.map((category_id) => ({ item_id: id, category_id })));
    if (icError) throw new Error(icError.message);
  }

  if (item?.product_id) revalidatePath(`/admin/products/${item.product_id}/edit`);
  redirect(`/admin/products/${item.product_id ?? ""}/edit`);
}

export async function deleteItem(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
}

export async function updateItemFromProduct(productId: string, itemId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const stock = Math.max(0, parseInt((formData.get("stock") as string) ?? "0", 10) || 0);
  const categoryIds = (formData.getAll("category_ids") as string[]).filter(Boolean);

  const { error } = await supabase.from("items").update({ stock }).eq("id", itemId);
  if (error) throw new Error(error.message);

  const { error: delError } = await supabase.from("item_categories").delete().eq("item_id", itemId);
  if (delError) throw new Error(delError.message);

  if (categoryIds.length > 0) {
    const { error: icError } = await supabase
      .from("item_categories")
      .insert(categoryIds.map((category_id) => ({ item_id: itemId, category_id })));
    if (icError) throw new Error(icError.message);
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  redirect(`/admin/products/${productId}/edit`);
}

export async function deleteItemFromProduct(productId: string, itemId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}/edit`);
  redirect(`/admin/products/${productId}/edit`);
}


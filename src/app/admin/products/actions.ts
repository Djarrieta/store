"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { CreateProductInput, CustomizationKind, UpdateProductInput } from "@/types";

const VALID_KINDS: CustomizationKind[] = ["phone_case", "tshirt", "mug"];

function parseKind(raw: FormDataEntryValue | null): CustomizationKind | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  return (VALID_KINDS as string[]).includes(value)
    ? (value as CustomizationKind)
    : null;
}

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

  const customizable = formData.get("customizable") === "on";
  const customization_kind = parseKind(formData.get("customization_kind"));

  if (customizable && !customization_kind) {
    throw new Error("Debes seleccionar un tipo de personalización.");
  }

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
    ocultar: formData.get("ocultar") === "on",
    customizable,
    customization_kind,
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

  // Detect destructive customization_kind change.
  const { data: existing, error: readErr } = await supabase
    .from("products")
    .select("customization_kind")
    .eq("id", id)
    .single();
  if (readErr) throw new Error(readErr.message);

  const previousKind = existing?.customization_kind ?? null;
  const nextKind = input.customization_kind ?? null;
  const kindChanged =
    previousKind !== null && nextKind !== null && previousKind !== nextKind;

  if (kindChanged) {
    // Wipe variations (print_templates cascade via items FK).
    const { error: delErr } = await supabase
      .from("items")
      .delete()
      .eq("product_id", id);
    if (delErr) throw new Error(delErr.message);
  }

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

// ---------------------------------------------------------------------------
// Print templates (per-item)
// ---------------------------------------------------------------------------

function trimmed(raw: FormDataEntryValue | null): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function parseFiniteNumber(raw: FormDataEntryValue | null): number | null {
  const value = Number(typeof raw === "string" ? raw : "");
  return Number.isFinite(value) ? value : null;
}

function parseSafeArea(formData: FormData) {
  const x = parseFiniteNumber(formData.get("safe_area_x"));
  const y = parseFiniteNumber(formData.get("safe_area_y"));
  const width = parseFiniteNumber(formData.get("safe_area_width"));
  const height = parseFiniteNumber(formData.get("safe_area_height"));
  if (x === null || y === null || width === null || height === null) return null;
  return { x, y, width, height };
}

function parseKindAttributes(
  kind: CustomizationKind,
  formData: FormData,
): Record<string, string> {
  if (kind === "phone_case") {
    const brand = trimmed(formData.get("attr_brand"));
    const model = trimmed(formData.get("attr_model"));
    if (!brand || !model) throw new Error("Marca y modelo son obligatorios.");
    return { brand, model };
  }
  if (kind === "tshirt") {
    const placement = trimmed(formData.get("attr_placement"));
    if (placement !== "front" && placement !== "back") {
      throw new Error("Selecciona la ubicación del estampado.");
    }
    return { placement };
  }
  // mug
  const wrap = trimmed(formData.get("attr_wrap"));
  if (wrap !== "full" && wrap !== "partial") {
    throw new Error("Selecciona el tipo de wrap del mug.");
  }
  return { wrap };
}

export async function upsertPrintTemplate(
  productId: string,
  itemId: string,
  formData: FormData,
) {
  await requireAdmin();
  const supabase = await createClient();

  // Look up the product to determine the kind — never trust the client.
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("customization_kind")
    .eq("id", productId)
    .single();
  if (prodErr) throw new Error(prodErr.message);
  const kind = product?.customization_kind as CustomizationKind | null;
  if (!kind) {
    throw new Error("El producto no está marcado como personalizable.");
  }

  const label = trimmed(formData.get("label"));
  if (!label) throw new Error("La etiqueta de la plantilla es obligatoria.");

  const width_mm = parseFiniteNumber(formData.get("width_mm"));
  const height_mm = parseFiniteNumber(formData.get("height_mm"));
  const print_dpi =
    parseFiniteNumber(formData.get("print_dpi")) ?? 300;
  if (!width_mm || width_mm <= 0 || !height_mm || height_mm <= 0) {
    throw new Error("Las dimensiones deben ser mayores que cero.");
  }
  if (!Number.isInteger(print_dpi) || print_dpi <= 0) {
    throw new Error("DPI inválido.");
  }

  const attributes = parseKindAttributes(kind, formData);
  const mockup_path = trimmed(formData.get("mockup_path")) || null;
  const mask_path = trimmed(formData.get("mask_path")) || null;
  const safe_area = parseSafeArea(formData);

  const { error } = await supabase.from("print_templates").upsert(
    {
      item_id: itemId,
      kind,
      label,
      attributes,
      width_mm,
      height_mm,
      print_dpi,
      mockup_path,
      mask_path,
      safe_area,
    },
    { onConflict: "item_id" },
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath(`/products/${productId}`);
}

export async function deletePrintTemplate(productId: string, itemId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("print_templates")
    .delete()
    .eq("item_id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath(`/products/${productId}`);
}

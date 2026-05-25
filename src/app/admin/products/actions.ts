"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateProductInput,
  KindAttributeField,
  UpdateProductInput,
} from "@/types";

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

async function parseInput(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
): Promise<CreateProductInput> {
  const category_id =
    (formData.get("category_id") as string | null)?.trim() || null;

  const customizable = formData.get("customizable") === "on";
  const customization_kind_id =
    (formData.get("customization_kind_id") as string | null)?.trim() || null;

  if (customizable && !customization_kind_id) {
    throw new Error("Debes seleccionar un tipo de personalización.");
  }

  if (customization_kind_id) {
    const { data: kind, error } = await supabase
      .from("customization_kinds")
      .select("id, archived")
      .eq("id", customization_kind_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!kind) throw new Error("Tipo de personalización inválido.");
    if (kind.archived) {
      throw new Error("Ese tipo de personalización está archivado.");
    }
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
    customization_kind_id: customizable ? customization_kind_id : null,
  };
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const input = await parseInput(supabase, formData);

  const { data: product, error } = await supabase.from("products").insert(input).select("id").single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}/edit`);
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const input: UpdateProductInput = await parseInput(supabase, formData);

  // Detect destructive customization_kind change.
  const { data: existing, error: readErr } = await supabase
    .from("products")
    .select("customization_kind_id")
    .eq("id", id)
    .single();
  if (readErr) throw new Error(readErr.message);

  const previousKind = existing?.customization_kind_id ?? null;
  const nextKind = input.customization_kind_id ?? null;
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
  schema: KindAttributeField[],
  formData: FormData,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const field of schema) {
    const raw = trimmed(formData.get(`attr_${field.key}`));
    if (!raw) {
      if (field.required) {
        throw new Error(`El campo "${field.label}" es obligatorio.`);
      }
      continue;
    }
    if (field.type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        throw new Error(`El campo "${field.label}" debe ser numérico.`);
      }
      out[field.key] = n;
    } else if (field.type === "select") {
      const valid = field.options.some((opt) => opt.value === raw);
      if (!valid) {
        throw new Error(`Valor inválido para "${field.label}".`);
      }
      out[field.key] = raw;
    } else {
      out[field.key] = raw;
    }
  }
  return out;
}

export async function upsertPrintTemplate(
  productId: string,
  itemId: string,
  formData: FormData,
) {
  await requireAdmin();
  const supabase = await createClient();

  // Resolve the product's kind + its attribute schema via join.
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select(
      "customization_kind:customization_kind_id(id, attribute_schema)",
    )
    .eq("id", productId)
    .single<{
      customization_kind: {
        id: string;
        attribute_schema: KindAttributeField[];
      } | null;
    }>();
  if (prodErr) throw new Error(prodErr.message);
  const kind = product?.customization_kind;
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

  const attributes = parseKindAttributes(kind.attribute_schema ?? [], formData);
  const mockup_path = trimmed(formData.get("mockup_path")) || null;
  const mask_path = trimmed(formData.get("mask_path")) || null;
  const safe_area = parseSafeArea(formData);

  const { error } = await supabase.from("print_templates").upsert(
    {
      item_id: itemId,
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

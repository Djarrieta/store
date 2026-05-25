"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { KindAttributeField } from "@/types";

const SLUG_RE = /^[a-z0-9][a-z0-9_]{1,38}[a-z0-9]$/;
const FIELD_KEY_RE = /^[a-z][a-z0-9_]{0,30}$/;

function trimmed(raw: FormDataEntryValue | null): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function parseSchema(raw: FormDataEntryValue | null): KindAttributeField[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("attribute_schema no es JSON válido.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("attribute_schema debe ser un arreglo.");
  }
  const seen = new Set<string>();
  const out: KindAttributeField[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) {
      throw new Error("Campo inválido en el esquema.");
    }
    const obj = item as Record<string, unknown>;
    const key = String(obj.key ?? "").trim();
    const label = String(obj.label ?? "").trim();
    const type = String(obj.type ?? "").trim();
    const required = Boolean(obj.required);
    if (!FIELD_KEY_RE.test(key)) {
      throw new Error(`Key inválido: "${key}".`);
    }
    if (seen.has(key)) throw new Error(`Key duplicado: "${key}".`);
    seen.add(key);
    if (!label) throw new Error(`El campo "${key}" requiere etiqueta.`);
    if (type === "text" || type === "number") {
      const placeholder =
        typeof obj.placeholder === "string" ? obj.placeholder : undefined;
      out.push({ key, label, type, required, placeholder });
    } else if (type === "select") {
      const optionsRaw = obj.options;
      if (!Array.isArray(optionsRaw) || optionsRaw.length === 0) {
        throw new Error(`"${key}" requiere al menos una opción.`);
      }
      const options = optionsRaw.map((opt) => {
        if (typeof opt !== "object" || opt === null) {
          throw new Error(`Opción inválida en "${key}".`);
        }
        const o = opt as Record<string, unknown>;
        const value = String(o.value ?? "").trim();
        const olabel = String(o.label ?? "").trim();
        if (!value || !olabel) {
          throw new Error(`Cada opción de "${key}" requiere value y label.`);
        }
        return { value, label: olabel };
      });
      out.push({ key, label, type, required, options });
    } else {
      throw new Error(`Tipo no soportado en "${key}": ${type}`);
    }
  }
  return out;
}

interface ParsedKindInput {
  label: string;
  picker_label: string;
  attribute_schema: KindAttributeField[];
  sort_order: number;
  archived: boolean;
}

function parseCommon(formData: FormData): ParsedKindInput {
  const label = trimmed(formData.get("label"));
  const picker_label = trimmed(formData.get("picker_label"));
  if (!label) throw new Error("El nombre es obligatorio.");
  if (!picker_label) throw new Error("El texto del selector es obligatorio.");
  const attribute_schema = parseSchema(formData.get("attribute_schema"));
  const sort_order = Number(formData.get("sort_order") ?? 0) || 0;
  const archived = formData.get("archived") === "on";
  return { label, picker_label, attribute_schema, sort_order, archived };
}

export async function createKind(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const slug = trimmed(formData.get("slug")).toLowerCase();
  if (!SLUG_RE.test(slug)) {
    throw new Error(
      "Slug inválido. Usa minúsculas, dígitos y guiones bajos (3-40 chars).",
    );
  }
  const common = parseCommon(formData);

  const { error } = await supabase.from("customization_kinds").insert({
    slug,
    ...common,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/customization-kinds");
  redirect("/admin/customization-kinds");
}

export async function updateKind(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const common = parseCommon(formData);

  const { error } = await supabase
    .from("customization_kinds")
    .update(common)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/customization-kinds");
  revalidatePath(`/admin/customization-kinds/${id}/edit`);
  redirect("/admin/customization-kinds");
}

/**
 * Returns counts of print_templates whose `attributes` are now misaligned
 * with the kind's `attribute_schema`. UI surfaces this as a warning so the
 * admin can audit existing variations.
 */
export async function auditKindAttributes(id: string): Promise<{
  orphaned: number;
  incomplete: number;
}> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: kind, error: kErr } = await supabase
    .from("customization_kinds")
    .select("attribute_schema")
    .eq("id", id)
    .single<{ attribute_schema: KindAttributeField[] }>();
  if (kErr || !kind) throw new Error(kErr?.message ?? "Tipo no encontrado.");

  const schemaKeys = new Set(kind.attribute_schema.map((f) => f.key));
  const requiredKeys = kind.attribute_schema
    .filter((f) => f.required)
    .map((f) => f.key);

  const { data: templates, error: tErr } = await supabase
    .from("print_templates")
    .select(
      "attributes, item:item_id!inner(product:product_id!inner(customization_kind_id))",
    )
    .eq("item.product.customization_kind_id", id)
    .returns<{ attributes: Record<string, unknown> }[]>();
  if (tErr) throw new Error(tErr.message);

  let orphaned = 0;
  let incomplete = 0;
  for (const t of templates ?? []) {
    const keys = Object.keys(t.attributes ?? {});
    if (keys.some((k) => !schemaKeys.has(k))) orphaned += 1;
    if (requiredKeys.some((k) => !(k in (t.attributes ?? {})))) incomplete += 1;
  }
  return { orphaned, incomplete };
}

export async function archiveKind(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { count, error: cErr } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("customization_kind_id", id);
  if (cErr) throw new Error(cErr.message);
  if ((count ?? 0) > 0) {
    throw new Error(
      `No puedes archivar: ${count} producto(s) usan este tipo. Cámbialos primero.`,
    );
  }

  const { error } = await supabase
    .from("customization_kinds")
    .update({ archived: true })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/customization-kinds");
}

export async function unarchiveKind(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("customization_kinds")
    .update({ archived: false })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/customization-kinds");
}

export async function deleteKind(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { count, error: cErr } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("customization_kind_id", id);
  if (cErr) throw new Error(cErr.message);
  if ((count ?? 0) > 0) {
    throw new Error(
      `No puedes eliminar: ${count} producto(s) usan este tipo.`,
    );
  }

  const { error } = await supabase
    .from("customization_kinds")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/customization-kinds");
}

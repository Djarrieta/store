"use server";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  CustomizationKind,
  CustomizationTransform,
  OrderCustomizationSnapshot,
  PrintTemplate,
  SafeArea,
} from "@/types";

const VALID_KINDS: CustomizationKind[] = ["phone_case", "tshirt", "mug"];

function parseTransform(raw: FormDataEntryValue | null): CustomizationTransform {
  if (typeof raw !== "string") throw new Error("transform requerido");
  const obj = JSON.parse(raw);
  if (
    typeof obj?.x !== "number" ||
    typeof obj?.y !== "number" ||
    typeof obj?.scale !== "number" ||
    typeof obj?.rotation !== "number"
  ) {
    throw new Error("transform inválido");
  }
  return { x: obj.x, y: obj.y, scale: obj.scale, rotation: obj.rotation };
}

function parseInt32(raw: FormDataEntryValue | null, label: string): number {
  const n = Number(typeof raw === "string" ? raw : NaN);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    throw new Error(`${label} inválido`);
  }
  return n;
}

async function uploadBucketObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  file: Blob,
  filename: string,
): Promise<string> {
  const ext = filename.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

/**
 * Called from the client at checkout — never while browsing.
 * Uploads the source + preview blobs, inserts a `customizations` row, then
 * returns a self-contained snapshot ready to embed in `OrderItem.customization`.
 */
export async function createCustomization(
  formData: FormData,
): Promise<OrderCustomizationSnapshot> {
  const user = await requireAuth();
  const supabase = await createClient();

  const itemId = String(formData.get("itemId") ?? "").trim();
  if (!itemId) throw new Error("itemId requerido");

  const transform = parseTransform(formData.get("transform"));
  const sourceWidth = parseInt32(formData.get("sourceWidth"), "sourceWidth");
  const sourceHeight = parseInt32(formData.get("sourceHeight"), "sourceHeight");

  const source = formData.get("source");
  const preview = formData.get("preview");
  if (!(source instanceof Blob)) throw new Error("source file requerido");
  if (!(preview instanceof Blob)) throw new Error("preview file requerido");

  // Load the print template to validate + snapshot it.
  const { data: templateRow, error: tplErr } = await supabase
    .from("print_templates")
    .select("*")
    .eq("item_id", itemId)
    .single<PrintTemplate>();
  if (tplErr || !templateRow) {
    throw new Error("Esta variación no tiene plantilla de impresión.");
  }
  if (!VALID_KINDS.includes(templateRow.kind)) {
    throw new Error(`kind inválido (${templateRow.kind})`);
  }

  const sourceName =
    source instanceof File ? source.name : `source-${crypto.randomUUID()}.bin`;
  const previewName =
    preview instanceof File ? preview.name : `preview-${crypto.randomUUID()}.png`;

  const sourcePath = await uploadBucketObject(
    supabase,
    "customizations-source",
    source,
    sourceName,
  );
  const previewPath = await uploadBucketObject(
    supabase,
    "customizations-preview",
    preview,
    previewName,
  );

  const { data: row, error: insErr } = await supabase
    .from("customizations")
    .insert({
      user_id: user.id,
      item_id: itemId,
      source_image_path: sourcePath,
      source_width_px: sourceWidth,
      source_height_px: sourceHeight,
      transform,
      preview_path: previewPath,
    })
    .select("id")
    .single<{ id: string }>();
  if (insErr || !row) throw new Error(insErr?.message ?? "No se pudo guardar.");

  const snapshot: OrderCustomizationSnapshot = {
    id: row.id,
    item_id: itemId,
    template_kind: templateRow.kind,
    template_label: templateRow.label,
    source_image_path: sourcePath,
    source_width_px: sourceWidth,
    source_height_px: sourceHeight,
    transform,
    template: {
      width_mm: templateRow.width_mm,
      height_mm: templateRow.height_mm,
      print_dpi: templateRow.print_dpi,
      mockup_path: templateRow.mockup_path,
      mask_path: templateRow.mask_path,
      safe_area: (templateRow.safe_area as SafeArea | null) ?? null,
    },
    preview_path: previewPath,
    print_path: null,
  };
  return snapshot;
}
